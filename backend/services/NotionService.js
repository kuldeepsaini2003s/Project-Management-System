import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership, assertTeamAdmin } from "../utils/membership.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { resolveReturnOrigin, resolveReturnPath } from "../utils/origin.js";

const buildState = (teamId, userId, origin, returnPath) =>
  signToken({ no: true, t: teamId, u: userId, c: resolveReturnOrigin(origin), p: resolveReturnPath(returnPath) });

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

export const buildAuthorizeUrl = async (userId, teamId, { origin, returnPath } = {}) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.notion.clientId) throw new ApiError(500, "Notion App is not configured on the server");

  const existing = await prisma.notionConnection.findUnique({ where: { teamId } });

  if (existing?.accessToken) {
    await prisma.notionConnection.update({ where: { teamId }, data: { active: true } });
    return {
      reconnected: true,
      workspaceName: existing.workspaceName,
      workspaceIcon: existing.workspaceIcon,
    };
  }

  return { url: notionOAuthUrl(buildState(teamId, userId, origin, returnPath)) };
};

export const handleOAuthCallback = async (query) => {
  let returnOrigin = env.clientUrl;
  const fail = (msg) => {
    return `${returnOrigin}/?notion=error&message=${encodeURIComponent(msg)}`;
  };

  const { code, state, error: notionError } = query;

  if (notionError) return fail(`Notion returned an error: ${notionError}`);
  if (!code) return fail("Notion did not return an authorization code");
  if (!state) return fail("Missing state — please start the connect again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { t: teamId, u: userId, no, c, p } = decoded || {};
  if (!no || !teamId || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("You are not authorized to connect Notion for this team");
  }

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

    if (!res.ok || data.error) {
      return fail(data.error_description || data.error || "Notion OAuth token exchange failed");
    }

    accessToken   = data.access_token;
    workspaceId   = data.workspace_id;
    workspaceName = data.workspace_name;
    workspaceIcon = data.workspace_icon || null;
    botId         = data.bot_id || null;

    if (!accessToken) return fail("Notion did not return an access token");
  } catch (e) {
    return fail("Could not reach Notion to complete the connection");
  }

  const before = await prisma.notionConnection.findUnique({ where: { teamId } });
  const isFirstConnect = !before;

  const after = await prisma.notionConnection.upsert({
    where: { teamId },
    update: { accessToken, workspaceId, workspaceName, workspaceIcon, botId, active: true },
    create: { teamId, accessToken, workspaceId, workspaceName, workspaceIcon, botId, active: true },
  });

  return `${returnOrigin}${p || `/teams/${teamId}/integrations/notion`}?notion=connected`;
};

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.notionConnection.findUnique({ where: { teamId } });
  const connected = !!conn?.accessToken && conn.active !== false;
  return {
    connected,
    workspaceName: connected ? conn.workspaceName || null : null,
    workspaceIcon: connected ? conn.workspaceIcon || null : null,
  };
};

export const disconnectNotion = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  const conn = await prisma.notionConnection.findUnique({ where: { teamId } });
  if (!conn) {
    return { ok: true };
  }
  await prisma.notionConnection.update({ where: { teamId }, data: { active: false } });
  return { ok: true };
};
