import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership, assertTeamAdmin } from "../utils/membership.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const log = (...args) => console.log("[notion]", ...args);

/* ---------------- OAuth helpers ---------------- */

const resolveReturnOrigin = (origin) => {
  const clean = (origin || "").replace(/\/$/, "");
  return env.clientUrls.includes(clean) ? clean : env.clientUrl;
};

const buildState = (teamId, userId, origin) =>
  signToken({ no: true, t: teamId, u: userId, c: resolveReturnOrigin(origin) });

// Notion OAuth v2 authorization URL.
const notionOAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: env.notion.clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: env.notion.redirectUri,
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params}`;
};

/* ---------------- Connect / reconnect ---------------- */

export const buildAuthorizeUrl = async (userId, teamId, { origin } = {}) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.notion.clientId) throw new ApiError(500, "Notion App is not configured on the server");

  const existing = await prisma.notionConnection.findUnique({ where: { teamId } });

  if (existing) {
    log(
      `authorize reconnect attempt: team=${teamId} user=${userId} ` +
        `workspace=${existing.workspaceName} active=${existing.active}`
    );
    // Notion access tokens do not expire, so we can reconnect instantly
    // if a stored token exists — no need to go through OAuth again.
    if (existing.accessToken) {
      await prisma.notionConnection.update({ where: { teamId }, data: { active: true } });
      log(
        `authorize reconnect SUCCESS: team=${teamId} workspace=${existing.workspaceName} → active=true`
      );
      return {
        reconnected: true,
        workspaceName: existing.workspaceName,
        workspaceIcon: existing.workspaceIcon,
      };
    }
    log(`authorize: team=${teamId} existing record has no accessToken → fresh OAuth flow`);
  } else {
    log(`authorize connect: team=${teamId} user=${userId} no existing connection → fresh OAuth flow`);
  }

  log(`authorize: team=${teamId} user=${userId} → redirecting to Notion OAuth`);
  return { url: notionOAuthUrl(buildState(teamId, userId, origin)) };
};

/* ---------------- OAuth callback ---------------- */

export const handleOAuthCallback = async (query) => {
  let returnOrigin = env.clientUrl;
  const fail = (msg) => {
    log("setup FAIL:", msg);
    return `${returnOrigin}/?notion=error&message=${encodeURIComponent(msg)}`;
  };

  const { code, state, error: notionError } = query;
  log("setup callback HIT. query=", JSON.stringify(query));

  if (notionError) return fail(`Notion returned an error: ${notionError}`);
  if (!code) return fail("Notion did not return an authorization code");
  if (!state) return fail("Missing state — please start the connect again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { t: teamId, u: userId, no, c } = decoded || {};
  log(`setup decoded state: teamId=${teamId} userId=${userId} no=${no} returnOrigin(c)=${c}`);
  if (!no || !teamId || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("You are not authorized to connect Notion for this team");
  }

  // Exchange the temporary code for an access token.
  let accessToken, workspaceId, workspaceName, workspaceIcon, botId;
  try {
    const credentials = Buffer.from(
      `${env.notion.clientId}:${env.notion.clientSecret}`
    ).toString("base64");

    const res = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: env.notion.redirectUri,
      }),
    });

    const data = await res.json();
    log("notion oauth/token response:", JSON.stringify(data));

    if (!res.ok || data.error) {
      return fail(data.error_description || data.error || "Notion OAuth token exchange failed");
    }

    accessToken   = data.access_token;
    workspaceId   = data.workspace_id;
    workspaceName = data.workspace_name;
    workspaceIcon = data.workspace_icon || null;
    botId         = data.bot_id || null;

    if (!accessToken) return fail("Notion did not return an access token");
    log(`setup: workspace=${workspaceName} (${workspaceId}) botId=${botId}`);
  } catch (e) {
    log("setup: error exchanging code:", e?.message);
    return fail("Could not reach Notion to complete the connection");
  }

  const before = await prisma.notionConnection.findUnique({ where: { teamId } });
  log("setup: NotionConnection BEFORE =", JSON.stringify(before));
  const isFirstConnect = !before;

  const after = await prisma.notionConnection.upsert({
    where: { teamId },
    update: { accessToken, workspaceId, workspaceName, workspaceIcon, botId, active: true },
    create: { teamId, accessToken, workspaceId, workspaceName, workspaceIcon, botId, active: true },
  });
  log("setup: NotionConnection AFTER  =", JSON.stringify({ ...after, accessToken: "[redacted]" }));
  log(
    `setup: ${isFirstConnect ? "CONNECT" : "RECONNECT"} complete — ` +
      `workspace=${workspaceName} team=${teamId} → redirecting to ${returnOrigin}`
  );

  return `${returnOrigin}/teams/${teamId}/integrations/notion?notion=connected`;
};

/* ---------------- Status ---------------- */

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.notionConnection.findUnique({ where: { teamId } });
  const connected = !!conn?.accessToken && conn.active !== false;
  log(`getConnection team=${teamId} → connected=${connected} workspace=${connected ? conn.workspaceName : "-"}`);
  return {
    connected,
    workspaceName: connected ? conn.workspaceName || null : null,
    workspaceIcon: connected ? conn.workspaceIcon || null : null,
  };
};

/* ---------------- Disconnect ---------------- */

export const disconnectNotion = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  const conn = await prisma.notionConnection.findUnique({ where: { teamId } });
  if (!conn) {
    log(`disconnect team=${teamId} → no connection record found`);
    return { ok: true };
  }
  await prisma.notionConnection.update({ where: { teamId }, data: { active: false } });
  log(`disconnect team=${teamId} workspace=${conn.workspaceName} → active=false`);
  return { ok: true };
};
