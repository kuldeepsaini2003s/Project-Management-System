import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamAdmin, assertTeamMembership } from "../utils/membership.js";
import { getIssueOrThrow } from "../utils/access.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const API = "https://api.github.com";
const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

// Diagnostic logger — every GitHub connect/callback/db step is traced with this.
const log = (...args) => console.log("[github]", ...args);

/* ---------------- App auth ---------------- */

// Short-lived JWT identifying the GitHub App (RS256, signed with the private key).
const appJwt = () => {
  if (!env.github.appId || !env.github.privateKey) {
    throw new ApiError(500, "GitHub App is not configured on the server");
  }
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iat: now - 60, exp: now + 9 * 60, iss: env.github.appId },
    env.github.privateKey,
    { algorithm: "RS256" }
  );
};

// Cache installation access tokens (valid ~1h) to avoid re-minting on every call.
const tokenCache = new Map(); // installationId -> { token, exp }

// Exported so other services (e.g. GitPersonaService) can mint installation
// tokens for teams the current user belongs to, without duplicating the
// GitHub App JWT-signing logic.
export const getInstallationToken = async (installationId) => {
  const cached = tokenCache.get(installationId);
  if (cached && cached.exp - 60_000 > Date.now()) return cached.token;

  const res = await fetch(`${API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: ghHeaders(appJwt()),
  });
  if (!res.ok) throw new ApiError(502, "Could not authenticate the GitHub installation");
  const data = await res.json();
  tokenCache.set(installationId, { token: data.token, exp: new Date(data.expires_at).getTime() });
  return data.token;
};

/* ---------------- Install flow ---------------- */

// Whether a specific installation still exists on GitHub (not uninstalled).
// IMPORTANT: only a confirmed 404 means "actually uninstalled". Any other
// failure (bad/expired App private key, GitHub rate limit, network blip) must
// NOT be treated as "gone" — doing so used to silently force the "fresh
// install" flow even when the installation was still live on GitHub's side.
// That's a trap: GitHub Apps skip the picker and redirect straight to the
// installation's management page when it's already installed, which never
// hits our Setup URL callback — so the connection could never repair itself
// and looked "stuck" until the user fully uninstalled and reinstalled.
// Surfacing a clear, retryable error here instead is much safer.
const installationExists = async (installationId) => {
  let res;
  try {
    res = await fetch(`${API}/app/installations/${installationId}`, {
      headers: ghHeaders(appJwt()),
    });
  } catch (e) {
    if (e instanceof ApiError) throw e; // e.g. "GitHub App is not configured on the server"
    log(`installationExists: network error checking installation=${installationId}:`, e?.message);
    throw new ApiError(502, "Could not reach GitHub to verify your installation — try again in a moment");
  }
  if (res.ok) return true;
  if (res.status === 404) return false; // confirmed: genuinely uninstalled
  const body = await res.text().catch(() => "");
  log(`installationExists: unexpected GitHub response ${res.status} for installation=${installationId}: ${body.slice(0, 300)}`);
  throw new ApiError(502, "Could not verify your GitHub installation right now — try again in a moment");
};

// Validate the frontend origin that started the flow against the allow-list, so
// the GitHub return redirect always lands back on a trusted frontend (and the
// correct one when several share a backend). Falls back to the primary origin.
const resolveReturnOrigin = (origin) => {
  const clean = (origin || "").replace(/\/$/, "");
  return env.clientUrls.includes(clean) ? clean : env.clientUrl;
};

// Sign the install "state": team + initiating user + return origin. GitHub echoes
// this back to the Setup URL, which is how the callback knows WHICH team/workspace
// to attach the installation to (so it can never leak to another team).
const buildState = (teamId, userId, origin) =>
  signToken({ gh: true, t: teamId, u: userId, c: resolveReturnOrigin(origin) });

const installUrl = (state) =>
  `https://github.com/apps/${env.github.appSlug}/installations/new?state=${encodeURIComponent(state)}`;

export const buildAuthorizeUrl = async (userId, teamId, { origin } = {}) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.github.appSlug) throw new ApiError(500, "GitHub App slug is not configured");

  const existing = await prisma.githubConnection.findUnique({ where: { teamId } });

  if (existing) {
    log(
      `authorize reconnect attempt: team=${teamId} user=${userId} ` +
        `installation=${existing.installationId} account=${existing.account} active=${existing.active}`
    );
    // Check if the stored GitHub installation is still valid.
    const exists = await installationExists(existing.installationId);
    if (exists) {
      // Reconnect instantly — no GitHub redirect needed.
      await prisma.githubConnection.update({ where: { teamId }, data: { active: true } });
      log(
        `authorize reconnect SUCCESS: team=${teamId} installation=${existing.installationId} ` +
          `account=${existing.account} → active=true`
      );
      return { reconnected: true, account: existing.account };
    }
    log(
      `authorize reconnect: team=${teamId} installation=${existing.installationId} ` +
        `no longer exists on GitHub → starting fresh installation flow`
    );
  } else {
    log(`authorize connect: team=${teamId} user=${userId} no existing connection → fresh installation flow`);
  }

  // No valid stored installation — send the user through GitHub's install flow.
  log(`authorize: team=${teamId} user=${userId} → redirecting to GitHub installation flow`);
  return { url: installUrl(buildState(teamId, userId, origin)) };
};

// GitHub's page to manage which repositories the installation can access.
// Carries state so the post-update redirect returns to the app and refreshes
// the connection (without state, GitHub would dead-end on the settings page).
export const buildManageUrl = async (userId, teamId, { origin } = {}) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.github.appSlug) throw new ApiError(500, "GitHub App slug is not configured");
  const conn = await prisma.githubConnection.findUnique({ where: { teamId } });
  if (!conn?.installationId || conn.active === false) {
    throw new ApiError(400, "GitHub is not connected for this team");
  }
  log(`manage: team=${teamId} installation=${conn.installationId} → configure repositories`);
  return { url: installUrl(buildState(teamId, userId, origin)) };
};

// GitHub redirects here after the user installs / selects repos / switches account.
export const handleSetupCallback = async (query) => {
  // Default error landing (real origin is recovered from state below when possible).
  let returnOrigin = env.clientUrl;
  const fail = (msg) => {
    log("setup FAIL:", msg);
    return `${returnOrigin}/?github=error&message=${encodeURIComponent(msg)}`;
  };

  const { installation_id: installationId, state, setup_action: setupAction } = query;
  log("setup callback HIT. query=", JSON.stringify(query));

  // The user requested install on an org needing owner approval (rare).
  if (setupAction === "request")
    return `${returnOrigin}/?github=error&message=Installation%20pending%20approval`;
  if (!installationId) return fail("GitHub did not return an installation id");
  if (!state) return fail("Missing authorization state — please start the connect again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { t: teamId, u: userId, gh, c } = decoded || {};
  log(`setup decoded state: teamId=${teamId} userId=${userId} gh=${gh} returnOrigin(c)=${c}`);
  if (!gh || !teamId || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  // The installation is attached to whichever team/user signed the state — so it
  // is stored per-team (within its workspace), never shared across teams/users.
  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("You are not authorized to connect GitHub for this team");
  }

  // Confirm the installation exists and capture which account (login + type) it
  // belongs to — straight from GitHub, so it can never be a stale value.
  let account = null;
  let accountType = null;
  try {
    const res = await fetch(`${API}/app/installations/${installationId}`, {
      headers: ghHeaders(appJwt()),
    });
    if (!res.ok) {
      log(`setup: GET /app/installations/${installationId} → HTTP ${res.status}`);
      return fail("Could not verify the GitHub installation");
    }
    const data = await res.json();
    account = data.account?.login || null;
    accountType = data.account?.type || null; // "User" or "Organization"
    log(`setup: installation ${installationId} belongs to ${account} (${accountType})`);
  } catch (e) {
    log("setup: error verifying installation:", e?.message);
    return fail("Could not reach GitHub to verify the installation");
  }

  const before = await prisma.githubConnection.findUnique({ where: { teamId } });
  log("setup: GithubConnection BEFORE =", JSON.stringify(before));
  const isFirstConnect = !before;
  log(isFirstConnect ? "setup: fresh connect (no prior record)" : `setup: updating existing record (was active=${before.active})`);

  const after = await prisma.githubConnection.upsert({
    where: { teamId },
    update: { installationId: String(installationId), account, accountType, active: true },
    create: { teamId, installationId: String(installationId), account, accountType, active: true },
  });
  log("setup: GithubConnection AFTER  =", JSON.stringify(after));
  log(
    `setup: ${isFirstConnect ? "CONNECT" : "REINSTALL"} complete — ` +
      `installation=${installationId} account=${account} team=${teamId} → redirecting to ${returnOrigin}`
  );

  return `${returnOrigin}/teams/${teamId}/integrations?github=connected`;
};

// GitHub redirects here instead of the Setup URL once "Request user
// authorization (OAuth) during installation" is enabled on the App. Unlike
// the Setup URL, GitHub reliably calls this every time — fresh install AND
// "already installed, just reauthorize" alike — which is what actually fixes
// the dead-end redirect to github.com/settings/installations/:id. We
// exchange the code for a user token, then ask GitHub which installation of
// OUR app that user can access, rather than trusting installation_id being
// present in the query string (it sometimes isn't on the reauth path).
export const handleOAuthCallback = async (query) => {
  let returnOrigin = env.clientUrl;
  const fail = (msg) => {
    log("oauth callback FAIL:", msg);
    return `${returnOrigin}/?github=error&message=${encodeURIComponent(msg)}`;
  };

  const { code, state, installation_id: installationIdHint, setup_action: setupAction } = query;
  log("oauth callback HIT. query=", JSON.stringify(query));

  if (setupAction === "request") {
    return `${returnOrigin}/?github=error&message=Installation%20pending%20approval`;
  }
  if (!code) return fail("GitHub did not return an authorization code");
  if (!state) return fail("Missing authorization state — please start the connect again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { t: teamId, u: userId, gh, c } = decoded || {};
  log(`oauth callback decoded state: teamId=${teamId} userId=${userId} gh=${gh} returnOrigin(c)=${c}`);
  if (!gh || !teamId || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("You are not authorized to connect GitHub for this team");
  }

  if (!env.github.clientId || !env.github.clientSecret) {
    return fail("GitHub OAuth is not configured on the server");
  }

  // Exchange the code for a user access token (same token endpoint OAuth
  // Apps use — every GitHub App has a client id/secret for this).
  let userToken;
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: env.github.clientId,
        client_secret: env.github.clientSecret,
        code,
        redirect_uri: env.github.callbackUri,
      }),
    });
    const data = await res.json();
    if (data.error) {
      log("oauth callback: token exchange error:", data.error, data.error_description);
      return fail(data.error_description || data.error);
    }
    userToken = data.access_token;
    if (!userToken) return fail("GitHub did not return an access token");
  } catch (e) {
    log("oauth callback: error exchanging code:", e?.message);
    return fail("Could not reach GitHub to complete the connection");
  }

  // Ask GitHub which installation(s) of any app this user can access, then
  // pick the one that's OUR app — this is what reliably finds the existing
  // installation even when installation_id wasn't in the query string.
  let installation = null;
  try {
    const res = await fetch("https://api.github.com/user/installations", {
      headers: {
        Authorization: `Bearer ${userToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      log(`oauth callback: GET /user/installations → HTTP ${res.status}`);
      return fail("Could not look up your GitHub installations");
    }
    const data = await res.json();
    const list = data.installations || [];
    log(`oauth callback: user has ${list.length} installation(s) visible`);
    installation =
      list.find((i) => String(i.id) === String(installationIdHint)) ||
      list.find((i) => String(i.app_id) === String(env.github.appId)) ||
      null;
  } catch (e) {
    log("oauth callback: error listing installations:", e?.message);
    return fail("Could not reach GitHub to look up your installation");
  }

  if (!installation) {
    // Genuinely no installation yet — send them through the full install
    // picker (this is the normal, expected first-time path, not an error).
    log(`oauth callback: no installation of this app found for user=${userId} → sending to install picker`);
    return `${installUrl(buildState(teamId, userId, c))}`;
  }

  const before = await prisma.githubConnection.findUnique({ where: { teamId } });
  const isFirstConnect = !before;

  await prisma.githubConnection.upsert({
    where: { teamId },
    update: {
      installationId: String(installation.id),
      account: installation.account?.login || null,
      accountType: installation.account?.type || null,
      active: true,
    },
    create: {
      teamId,
      installationId: String(installation.id),
      account: installation.account?.login || null,
      accountType: installation.account?.type || null,
      active: true,
    },
  });

  log(
    `oauth callback: ${isFirstConnect ? "CONNECT" : "RECONNECT"} complete — team=${teamId} ` +
      `installation=${installation.id} account=${installation.account?.login} → redirecting to ${returnOrigin}`
  );
  return `${returnOrigin}/teams/${teamId}/integrations?github=connected`;
};

/* ---------------- Status / repos ---------------- */

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.githubConnection.findUnique({ where: { teamId } });
  const connected = !!conn?.installationId && conn.active !== false;
  log(`getConnection team=${teamId} → connected=${connected} account=${connected ? conn.account : "-"}`);
  return { connected, account: connected ? conn.account || null : null };
};

export const listRepos = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.githubConnection.findUnique({ where: { teamId } });
  if (!conn?.installationId || conn.active === false) {
    throw new ApiError(400, "GitHub is not connected for this team");
  }

  const token = await getInstallationToken(conn.installationId);
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`${API}/installation/repositories?per_page=100&page=${page}`, {
      headers: ghHeaders(token),
    });
    if (!res.ok) throw new ApiError(502, "Failed to fetch repositories from GitHub");
    // eslint-disable-next-line no-await-in-loop
    const data = await res.json();
    const batch = data.repositories || [];
    repos.push(...batch.map((r) => ({
      fullName: r.full_name,
      name: r.name,
      owner: r.owner?.login || r.full_name.split("/")[0],
      private: r.private,
      description: r.description || null,
      language: r.language || null,
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      openIssues: r.open_issues_count ?? 0,
      defaultBranch: r.default_branch || "main",
      htmlUrl: r.html_url,
      updatedAt: r.updated_at || null,
    })));
    if (batch.length < 100) break;
  }
  return repos;
};

export const disconnectGithub = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  // Mark as inactive — do NOT delete the record or uninstall the GitHub App.
  // This lets reconnect work instantly (active=true) if the installation is still valid,
  // without requiring the user to go through GitHub's install flow again.
  const conn = await prisma.githubConnection.findUnique({ where: { teamId } });
  if (!conn) {
    log(`disconnect team=${teamId} → no connection record found`);
    return { ok: true };
  }
  await prisma.githubConnection.update({ where: { teamId }, data: { active: false } });
  log(
    `disconnect team=${teamId} installation=${conn.installationId} account=${conn.account} → active=false`
  );
  return { ok: true };
};

/* ---------------- Manual PR linking ---------------- */

export const linkPullRequest = async (userId, issueId, url) => {
  await getIssueOrThrow(userId, issueId);
  const clean = String(url || "").trim();
  if (!/^https?:\/\/github\.com\/.+\/pull\/\d+/.test(clean)) {
    throw new ApiError(400, "Enter a valid GitHub pull request URL");
  }
  const number = Number(clean.match(/\/pull\/(\d+)/)?.[1]) || null;
  await prisma.pullRequestLink.upsert({
    where: { issueId_url: { issueId, url: clean } },
    update: {},
    create: { issueId, url: clean, number, title: `PR #${number}`, state: "open" },
  });
  return { ok: true };
};

export const unlinkPullRequest = async (userId, linkId) => {
  const link = await prisma.pullRequestLink.findUnique({ where: { id: linkId } });
  if (!link) throw new ApiError(404, "Link not found");
  await getIssueOrThrow(userId, link.issueId);
  await prisma.pullRequestLink.delete({ where: { id: linkId } });
  return { ok: true };
};

/* ---------------- Webhook receiver (app-level) ---------------- */

const verifySignature = (rawBody, signature) => {
  const secret = env.github.webhookSecret;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const handleGithubWebhook = async (event, rawBody, signature) => {
  if (!verifySignature(rawBody, signature)) throw new ApiError(401, "Invalid webhook signature");

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new ApiError(400, "Invalid payload");
  }

  if (event !== "pull_request") return { ok: true, ignored: `event ${event}` };

  const repoFullName = payload?.repository?.full_name;
  const pr = payload.pull_request;
  if (!repoFullName || !pr) return { ok: true };

  // Find the project (and team) linked to this repo.
  const project = await prisma.project.findFirst({
    where: { repoFullName },
    include: { team: true },
  });
  const team = project?.team;
  if (!team) return { ok: true, ignored: "repo not linked to a project" };

  const action = payload.action;
  const merged = !!pr.merged;
  const state = merged ? "merged" : action === "closed" ? "closed" : "open";

  const haystack = `${pr.title || ""} ${pr.head?.ref || ""} ${pr.body || ""}`;
  const re = new RegExp(`\\b${team.key}-(\\d+)\\b`, "gi");
  const numbers = [...new Set([...haystack.matchAll(re)].map((m) => Number(m[1])))];

  for (const number of numbers) {
    const issue = await prisma.issue.findUnique({
      where: { teamId_number: { teamId: team.id, number } },
    });
    if (!issue) continue;

    await prisma.pullRequestLink.upsert({
      where: { issueId_url: { issueId: issue.id, url: pr.html_url } },
      update: { state, title: pr.title, number: pr.number, author: pr.user?.login },
      create: {
        issueId: issue.id,
        url: pr.html_url,
        number: pr.number,
        title: pr.title,
        state,
        author: pr.user?.login,
      },
    });

    if ((action === "opened" || action === "reopened" || merged) && issue.status !== "DONE") {
      await prisma.issue.update({ where: { id: issue.id }, data: { status: "DONE" } });
    }
  }

  return { ok: true, linked: numbers.length };
};
