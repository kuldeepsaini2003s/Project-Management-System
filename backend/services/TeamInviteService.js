import crypto from "crypto";
import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamAdmin } from "../utils/membership.js";
import { env } from "../config/env.js";
import { sendTeamInviteEmail } from "./EmailService.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildInviteUrl = (token) => `${env.clientUrl}/invite/${token}`;

export const createTeamInvites = async (userId, teamId, emails, role = "MEMBER") => {
  await assertTeamAdmin(userId, teamId);

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new ApiError(404, "Team not found");
  if (!["MEMBER", "ADMIN"].includes(role)) role = "MEMBER";

  const list = Array.isArray(emails) ? emails : [];
  const cleaned = [
    ...new Set(
      list
        .map((e) => String(e || "").trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e))
    ),
  ];
  if (cleaned.length === 0) throw new ApiError(400, "Provide at least one valid email address");

  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const expiresAt = new Date(Date.now() + env.inviteTtlHours * 60 * 60 * 1000);
  const results = [];

  for (const email of cleaned) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const membership = await prisma.teamMembership.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (membership) {
        results.push({ email, status: "already_member" });
        continue;
      }
    }

    const token = crypto.randomBytes(24).toString("hex");
    await prisma.teamInvite.create({
      data: { email, token, role, teamId, invitedById: userId, expiresAt },
    });

    const url = buildInviteUrl(token);
    let emailSent = false;
    try {
      emailSent = await sendTeamInviteEmail({
        to: email,
        inviteUrl: url,
        teamName: team.name,
        inviterName: inviter?.name,
        expiresAt,
      });
    } catch (err) {
      console.error("[email] Failed to send invite to", email, err.message);
    }

    results.push({ email, status: "invited", url, expiresAt, emailSent });
  }

  return { invites: results };
};

export const getInviteByToken = async (token) => {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: { select: { id: true, name: true, icon: true, color: true } } },
  });
  if (!invite) throw new ApiError(404, "Invite not found");

  let status = invite.status;
  if (status === "PENDING" && invite.expiresAt < new Date()) {
    await prisma.teamInvite.update({ where: { token }, data: { status: "EXPIRED" } });
    status = "EXPIRED";
  }

  return {
    email: invite.email,
    role: invite.role,
    status,
    expiresAt: invite.expiresAt,
    team: invite.team,
  };
};

export const acceptInvite = async (userId, token) => {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  });
  if (!invite) throw new ApiError(404, "Invite not found");

  if (invite.status === "REVOKED") throw new ApiError(410, "This invite has been revoked");
  if (invite.status === "PENDING" && invite.expiresAt < new Date()) {
    await prisma.teamInvite.update({ where: { token }, data: { status: "EXPIRED" } });
    throw new ApiError(410, "This invite has expired");
  }
  if (invite.status === "EXPIRED") throw new ApiError(410, "This invite has expired");

  await prisma.$transaction([
    prisma.membership.upsert({
      where: { userId_workspaceId: { userId, workspaceId: invite.team.workspaceId } },
      update: {},
      create: { userId, workspaceId: invite.team.workspaceId, role: "MEMBER" },
    }),
    prisma.teamMembership.upsert({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
      update: {},
      create: { teamId: invite.teamId, userId, role: invite.role },
    }),
    prisma.teamInvite.update({
      where: { token },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
  ]);

  return { teamId: invite.teamId, teamName: invite.team.name };
};
