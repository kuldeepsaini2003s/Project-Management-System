import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership, assertTeamAdmin } from "../utils/membership.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const log = (...args) => console.log("[slack]", ...args);

/* ---------------- OAuth helpers ---------------- */

// Validate and resolve the frontend origin (same pattern as GitHub).
const resolveReturnOrigin = (origin) => {
  const clean = (origin || "").replace(/\/$/, "");
  return env.clientUrls.includes(clean) ? clean : env.clientUrl;
};

// Signed state carries team + user + return origin so the public callback
// knows which team to attach the Slack connection to.
const buildState = (teamId, userId, origin) =>
  signToken({ sl: true, t: teamId, u: userId, c: resolveReturnOrigin(origin) });

// Slack OAuth v2 authorization URL.
// scope (bot scopes): channels:read + users:read — list channels and members via API.
// user_scope: incoming-webhook — lets user pick a channel and gives us a webhook URL.
const slackOAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: env.slack.clientId,
    scope: "channels:read,users:read",
    user_scope: "incoming-webhook",
    redirect_uri: env.slack.redirectUri,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params}`;
};

/* ---------------- Connect / reconnect ---------------- */

export const buildAuthorizeUrl = async (userId, teamId, { origin } = {}) => {
  await assertTeamAdmin(userId, teamId);
  if (!env.slack.clientId) throw new ApiError(500, "Slack App is not configured on the server");

  const existing = await prisma.slackConnection.findUnique({ where: { teamId } });

  if (existing) {
    log(
      `authorize reconnect attempt: team=${teamId} user=${userId} ` +
        `channel=${existing.channel} active=${existing.active}`
    );
    // We can't cheaply verify a Slack webhook without sending a message.
    // If the record exists and the webhookUrl is stored, reconnect instantly.
    // The webhook remains valid until the Slack App is removed from the workspace.
    if (existing.webhookUrl) {
      await prisma.slackConnection.update({ where: { teamId }, data: { active: true } });
      log(
        `authorize reconnect SUCCESS: team=${teamId} channel=${existing.channel} ` +
          `workspace=${existing.slackTeamName} → active=true`
      );
      return { reconnected: true, channel: existing.channel, slackTeamName: existing.slackTeamName };
    }
    log(`authorize: team=${teamId} existing record has no webhookUrl → fresh OAuth flow`);
  } else {
    log(`authorize connect: team=${teamId} user=${userId} no existing connection → fresh OAuth flow`);
  }

  log(`authorize: team=${teamId} user=${userId} → redirecting to Slack OAuth`);
  return { url: slackOAuthUrl(buildState(teamId, userId, origin)) };
};

/* ---------------- OAuth callback ---------------- */

export const handleOAuthCallback = async (query) => {
  let returnOrigin = env.clientUrl;
  const fail = (msg) => {
    log("setup FAIL:", msg);
    return `${returnOrigin}/?slack=error&message=${encodeURIComponent(msg)}`;
  };

  const { code, state, error: slackError } = query;
  log("setup callback HIT. query=", JSON.stringify(query));

  if (slackError) return fail(`Slack returned an error: ${slackError}`);
  if (!code) return fail("Slack did not return an authorization code");
  if (!state) return fail("Missing state — please start the connect again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { t: teamId, u: userId, sl, c } = decoded || {};
  log(`setup decoded state: teamId=${teamId} userId=${userId} sl=${sl} returnOrigin(c)=${c}`);
  if (!sl || !teamId || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  try {
    await assertTeamAdmin(userId, teamId);
  } catch {
    return fail("You are not authorized to connect Slack for this team");
  }

  // Exchange the temporary code for an access token + webhook URL.
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
    log("slack oauth.v2.access response:", JSON.stringify(data));

    if (!data.ok) return fail(data.error || "Slack OAuth exchange failed");

    // Bot token (xoxb-...) from bot scope: channels:read,users:read
    accessToken = data.access_token || null;
    // Webhook from user_scope: incoming-webhook (in authed_user or top-level)
    const wh = data.incoming_webhook || data.authed_user?.incoming_webhook;
    webhookUrl = wh?.url;
    channel    = wh?.channel || null;
    channelId  = wh?.channel_id || null;
    slackTeamId   = data.team?.id;
    slackTeamName = data.team?.name;

    if (!webhookUrl) return fail("Slack did not return a webhook URL — ensure incoming-webhook scope is granted");
    log(`setup: webhook channel=${channel} (${channelId}) workspace=${slackTeamName} (${slackTeamId}) botToken=${accessToken ? "yes" : "no"}`);
  } catch (e) {
    log("setup: error exchanging code:", e?.message);
    return fail("Could not reach Slack to complete the connection");
  }

  const before = await prisma.slackConnection.findUnique({ where: { teamId } });
  log("setup: SlackConnection BEFORE =", JSON.stringify(before));
  const isFirstConnect = !before;

  const after = await prisma.slackConnection.upsert({
    where: { teamId },
    update: { webhookUrl, channel, channelId, slackTeamId, slackTeamName, accessToken, active: true },
    create: { teamId, webhookUrl, channel, channelId, slackTeamId, slackTeamName, accessToken, active: true },
  });
  log("setup: SlackConnection AFTER  =", JSON.stringify(after));
  log(
    `setup: ${isFirstConnect ? "CONNECT" : "RECONNECT"} complete — ` +
      `channel=${channel} workspace=${slackTeamName} team=${teamId} → redirecting to ${returnOrigin}`
  );

  return `${returnOrigin}/teams/${teamId}/integrations/slack?slack=connected`;
};

/* ---------------- Status ---------------- */

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  const connected = !!conn?.webhookUrl && conn.active !== false;
  log(`getConnection team=${teamId} → connected=${connected} channel=${connected ? conn.channel : "-"}`);
  return {
    connected,
    channel: connected ? conn.channel || null : null,
    slackTeamName: connected ? conn.slackTeamName || null : null,
  };
};

/* ---------------- Disconnect ---------------- */

export const disconnectSlack = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  // Soft disconnect — keep the record so reconnect works instantly.
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  if (!conn) {
    log(`disconnect team=${teamId} → no connection record found`);
    return { ok: true };
  }
  await prisma.slackConnection.update({ where: { teamId }, data: { active: false } });
  log(`disconnect team=${teamId} channel=${conn.channel} workspace=${conn.slackTeamName} → active=false`);
  return { ok: true };
};

/* ---------------- Post message (internal use) ---------------- */

// Best-effort post to a team's Slack channel. Never throws to the caller.
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
  } catch (err) {
    console.warn("[slack] post failed:", err.message);
    return false;
  }
};

/* ---------------- Workspace info (channels + channel members) ---------------- */

const slackApi = async (token, path) => {
  const res = await fetch(`https://slack.com/api/${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return res.json();
};

export const getSlackInfo = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  if (!conn?.webhookUrl || conn.active === false) throw new ApiError(400, "Slack is not connected for this team");

  // No bot token stored — return minimal info (legacy connections pre-scope-update)
  if (!conn.accessToken) {
    return { channel: conn.channel, channelId: null, workspace: conn.slackTeamName, members: [], channels: [], needsReconnect: true };
  }

  const token = conn.accessToken;
  let members = [];
  let channels = [];

  // Fetch channel members for the connected channel
  if (conn.channelId) {
    try {
      const membersData = await slackApi(token, `conversations.members?channel=${conn.channelId}&limit=100`);
      if (membersData.ok && membersData.members?.length) {
        // Fetch display info for each member (batch via users.list)
        const usersData = await slackApi(token, "users.list?limit=200");
        if (usersData.ok) {
          const memberSet = new Set(membersData.members);
          members = (usersData.members || [])
            .filter((u) => memberSet.has(u.id) && !u.is_bot && u.id !== "USLACKBOT")
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
    } catch (err) {
      log("getSlackInfo: failed to fetch members:", err.message);
    }
  }

  // Fetch workspace channels
  try {
    const chData = await slackApi(token, "conversations.list?types=public_channel&limit=100&exclude_archived=true");
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
  } catch (err) {
    log("getSlackInfo: failed to fetch channels:", err.message);
  }

  return {
    channel: conn.channel,
    channelId: conn.channelId,
    workspace: conn.slackTeamName,
    members,
    channels,
    needsReconnect: false,
  };
};
