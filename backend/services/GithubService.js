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

const getInstallationToken = async (installationId) => {
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

export const buildAuthorizeUrl = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.github.appSlug) throw new ApiError(500, "GitHub App slug is not configured");
  const state = signToken({ gh: true, t: teamId, u: userId });
  return { url: `https://github.com/apps/${env.github.appSlug}/installations/new?state=${state}` };
};

// GitHub redirects here after the user installs/selects repos.
export const handleSetupCallback = async (query) => {
  const fail = (msg) => `${env.clientUrl}/?github=error&message=${encodeURIComponent(msg)}`;
  const { installation_id: installationId, state } = query;
  if (!installationId || !state) return fail("Missing installation/state");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired state");
  }
  const { t: teamId, u: userId, gh } = decoded || {};
  if (!gh || !teamId || !userId) return fail("Invalid state");

  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("Not authorized for this team");
  }

  // Look up which account the app was installed on.
  let account = null;
  try {
    const res = await fetch(`${API}/app/installations/${installationId}`, {
      headers: ghHeaders(appJwt()),
    });
    if (res.ok) {
      const data = await res.json();
      account = data.account?.login || null;
    }
  } catch {
    /* non-fatal */
  }

  await prisma.githubConnection.upsert({
    where: { teamId },
    update: { installationId: String(installationId), account },
    create: { teamId, installationId: String(installationId), account },
  });

  return `${env.clientUrl}/teams/${teamId}/integrations?github=connected`;
};

/* ---------------- Status / repos ---------------- */

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.githubConnection.findUnique({ where: { teamId } });
  return { connected: !!conn?.installationId, account: conn?.account || null };
};

export const listRepos = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.githubConnection.findUnique({ where: { teamId } });
  if (!conn?.installationId) throw new ApiError(400, "GitHub is not connected for this team");

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
    repos.push(...batch.map((r) => ({ fullName: r.full_name, private: r.private })));
    if (batch.length < 100) break;
  }
  return repos;
};

export const disconnectGithub = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  await prisma.githubConnection.deleteMany({ where: { teamId } });
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
