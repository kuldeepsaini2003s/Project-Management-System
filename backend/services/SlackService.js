import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership, assertTeamAdmin } from "../utils/membership.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const resolveReturnOrigin = (origin) => {
  const clean = (origin || "").replace(/\/$/, "");
  return env.clientUrls.includes(clean) ? clean : env.clientUrl;
};

const SAFE_PATH = /^\/[a-zA-Z0-9\-_/]*$/;
const resolveReturnPath = (path) =>
  typeof path === "string" && path.length < 200 && SAFE_PATH.test(path)
    ? path
    : null;

const buildState = (teamId, userId, origin, returnPath) =>
  signToken({
    sl: true,
    t: teamId,
    u: userId,
    c: resolveReturnOrigin(origin),
    p: resolveReturnPath(returnPath),
  });

const slackOAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: env.slack.clientId,
    scope: [
      "channels:read",
      "groups:read",
      "users:read",
      "team:read",
      "chat:write",
      "incoming-webhook",
    ].join(","),
    redirect_uri: env.slack.redirectUri,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params}`;
};

export const buildAuthorizeUrl = async (
  userId,
  teamId,
  { origin, returnPath } = {},
) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.slack.clientId)
    throw new ApiError(500, "Slack App is not configured on the server");

  const existing = await prisma.slackConnection.findUnique({
    where: { teamId },
  });

  if (existing?.webhookUrl) {
    await prisma.slackConnection.update({
      where: { teamId },
      data: { active: true },
    });
    return {
      reconnected: true,
      channel: existing.channel,
      slackTeamName: existing.slackTeamName,
    };
  }

  return { url: slackOAuthUrl(buildState(teamId, userId, origin, returnPath)) };
};

export const handleOAuthCallback = async (query) => {
  let returnOrigin = env.clientUrl;
  const fail = (msg) => {
    return `${returnOrigin}/?slack=error&message=${encodeURIComponent(msg)}`;
  };

  const { code, state, error: slackError } = query;

  if (slackError) return fail(`Slack returned an error: ${slackError}`);
  if (!code) return fail("Slack did not return an authorization code");
  if (!state) return fail("Missing state — please start the connect again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { t: teamId, u: userId, sl, c, p } = decoded || {};
  if (!sl || !teamId || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("You are not authorized to connect Slack for this team");
  }

  let webhookUrl, channel, channelId, slackTeamId, slackTeamName, accessToken;
  try {
    const params = new URLSearchParams({
      client_id: env.slack.clientId,
      client_secret: env.slack.clientSecret,
      code,
      redirect_uri: env.slack.redirectUri,
    });
    const res = await fetch(`https://slack.com/api/oauth.v2.access`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await res.json();

    if (!data.ok) return fail(data.error || "Slack OAuth exchange failed");

    accessToken = data.access_token || null;
    const wh = data.incoming_webhook || data.authed_user?.incoming_webhook;
    webhookUrl = wh?.url;
    channel = wh?.channel || null;
    channelId = wh?.channel_id || null;
    slackTeamId = data.team?.id;
    slackTeamName = data.team?.name;

    if (!webhookUrl)
      return fail(
        "Slack did not return a webhook URL — ensure incoming-webhook scope is granted",
      );
  } catch (e) {
    return fail("Could not reach Slack to complete the connection");
  }

  const before = await prisma.slackConnection.findUnique({ where: { teamId } });
  const isFirstConnect = !before;

  const after = await prisma.slackConnection.upsert({
    where: { teamId },
    update: {
      webhookUrl,
      channel,
      channelId,
      slackTeamId,
      slackTeamName,
      accessToken,
      active: true,
    },
    create: {
      teamId,
      webhookUrl,
      channel,
      channelId,
      slackTeamId,
      slackTeamName,
      accessToken,
      active: true,
    },
  });

  return `${returnOrigin}${p || `/teams/${teamId}/integrations/slack`}?slack=connected`;
};

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  const connected = !!conn?.webhookUrl && conn.active !== false;
  return {
    connected,
    channel: connected ? conn.channel || null : null,
    slackTeamName: connected ? conn.slackTeamName || null : null,
  };
};

export const disconnectSlack = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  if (!conn) {
    return { ok: true };
  }
  await prisma.slackConnection.update({
    where: { teamId },
    data: { active: false },
  });
  return { ok: true };
};

export const postToWebhook = async (webhookUrl, text) => {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const postToTeamSlack = async (teamId, text) => {
  try {
    const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
    if (!conn?.webhookUrl || conn.active === false) return false;
    const res = await fetch(conn.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

const slackApi = async (token, path) => {
  const res = await fetch(`https://slack.com/api/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
};

export const getSlackInfo = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  if (!conn?.webhookUrl || conn.active === false)
    throw new ApiError(400, "Slack is not connected for this team");

  if (!conn.accessToken) {
    return {
      channel: conn.channel,
      channelId: null,
      workspace: conn.slackTeamName,
      members: [],
      channels: [],
      needsReconnect: true,
    };
  }

  const token = conn.accessToken;
  let members = [];
  let channels = [];

  if (conn.channelId) {
    try {
      const membersData = await slackApi(
        token,
        `conversations.members?channel=${conn.channelId}&limit=100`,
      );
      if (membersData.ok && membersData.members?.length) {
        const usersData = await slackApi(token, "users.list?limit=200");
        if (usersData.ok) {
          const memberSet = new Set(membersData.members);
          members = (usersData.members || [])
            .filter(
              (u) => memberSet.has(u.id) && !u.is_bot && u.id !== "USLACKBOT",
            )
            .map((u) => ({
              id: u.id,
              name: u.profile?.display_name || u.real_name || u.name,
              realName: u.real_name || null,
              avatar: u.profile?.image_72 || u.profile?.image_48 || null,
              title: u.profile?.title || null,
              isAdmin: u.is_admin || false,
            }));
        }
      }
    } catch (err) {}
  }

  try {
    const chData = await slackApi(
      token,
      "conversations.list?types=public_channel&limit=100&exclude_archived=true",
    );
    if (chData.ok) {
      channels = (chData.channels || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        memberCount: ch.num_members ?? 0,
        topic: ch.topic?.value || null,
        purpose: ch.purpose?.value || null,
        isPrivate: ch.is_private || false,
        isMember: ch.is_member || false,
      }));
    }
  } catch (err) {}

  return {
    channel: conn.channel,
    channelId: conn.channelId,
    workspace: conn.slackTeamName,
    members,
    channels,
    needsReconnect: false,
  };
};
