import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership, assertTeamAdmin } from "../utils/membership.js";

const shape = (conn) =>
  conn ? { connected: true, channel: conn.channel || null } : { connected: false };

export const getConnection = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
  return shape(conn);
};

export const connectSlack = async (userId, teamId, webhookUrl, channel) => {
  await assertTeamAdmin(userId, teamId);
  const url = String(webhookUrl || "").trim();
  if (!/^https:\/\/hooks\.slack\.com\/services\/.+/.test(url)) {
    throw new ApiError(400, "Enter a valid Slack Incoming Webhook URL");
  }
  await prisma.slackConnection.upsert({
    where: { teamId },
    update: { webhookUrl: url, channel: channel || null },
    create: { teamId, webhookUrl: url, channel: channel || null },
  });
  return { connected: true, channel: channel || null };
};

export const disconnectSlack = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  await prisma.slackConnection.deleteMany({ where: { teamId } });
  return { ok: true };
};

// Best-effort post to a team's Slack channel. Never throws to the caller.
export const postToTeamSlack = async (teamId, text) => {
  try {
    const conn = await prisma.slackConnection.findUnique({ where: { teamId } });
    if (!conn?.webhookUrl) return false;
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
