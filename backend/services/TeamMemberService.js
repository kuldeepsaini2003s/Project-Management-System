import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership, assertTeamAdmin } from "../utils/membership.js";

const userSelect = { id: true, name: true, email: true, avatarUrl: true };

const shapeMember = (m) => ({ ...m.user, role: m.role, joinedAt: m.createdAt });

export const getTeamMembers = async (userId, teamId) => {
  await assertTeamMembership(userId, teamId);
  const members = await prisma.teamMembership.findMany({
    where: { teamId },
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "asc" },
  });
  return members.map(shapeMember);
};

// Add an existing workspace member to the team.
export const addTeamMember = async (userId, teamId, targetUserId, role = "MEMBER") => {
  await assertTeamAdmin(userId, teamId);
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  const inWorkspace = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId: team.workspaceId } },
  });
  if (!inWorkspace) throw new ApiError(400, "User is not in this workspace");

  await prisma.teamMembership.upsert({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    update: {},
    create: { teamId, userId: targetUserId, role },
  });
  return getTeamMembers(userId, teamId);
};

export const removeTeamMember = async (userId, teamId, targetUserId) => {
  await assertTeamAdmin(userId, teamId);

  const target = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });
  if (!target) throw new ApiError(404, "Member not found");

  if (target.role === "OWNER") {
    const owners = await prisma.teamMembership.count({ where: { teamId, role: "OWNER" } });
    if (owners <= 1) throw new ApiError(400, "Cannot remove the last owner");
  }

  await prisma.teamMembership.delete({
    where: { teamId_userId: { teamId, userId: targetUserId } },
  });
  return getTeamMembers(userId, teamId);
};

export const updateTeamMemberRole = async (userId, teamId, targetUserId, role) => {
  await assertTeamAdmin(userId, teamId);
  if (!["OWNER", "ADMIN", "MEMBER"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }
  await prisma.teamMembership.update({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    data: { role },
  });
  return getTeamMembers(userId, teamId);
};

/* ---------------- Join requests ---------------- */

// Any authenticated user can request to join a team via its share link.
export const createJoinRequest = async (userId, teamId) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new ApiError(404, "Team not found");

  const existing = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (existing) throw new ApiError(409, "You're already a member of this team");

  const request = await prisma.teamJoinRequest.upsert({
    where: { teamId_userId: { teamId, userId } },
    update: { status: "PENDING" },
    create: { teamId, userId },
  });
  return { status: request.status };
};

export const getPendingJoinRequests = async (userId, teamId) => {
  await assertTeamAdmin(userId, teamId);
  const requests = await prisma.teamJoinRequest.findMany({
    where: { teamId, status: "PENDING" },
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "asc" },
  });
  return requests.map((r) => ({ id: r.id, user: r.user, createdAt: r.createdAt }));
};

export const respondToJoinRequest = async (userId, requestId, accept) => {
  const request = await prisma.teamJoinRequest.findUnique({
    where: { id: requestId },
    include: { team: true },
  });
  if (!request) throw new ApiError(404, "Request not found");
  await assertTeamAdmin(userId, request.teamId);

  if (accept) {
    await prisma.$transaction([
      // Ensure workspace membership so they can load the workspace.
      prisma.membership.upsert({
        where: {
          userId_workspaceId: { userId: request.userId, workspaceId: request.team.workspaceId },
        },
        update: {},
        create: { userId: request.userId, workspaceId: request.team.workspaceId, role: "MEMBER" },
      }),
      prisma.teamMembership.upsert({
        where: { teamId_userId: { teamId: request.teamId, userId: request.userId } },
        update: {},
        create: { teamId: request.teamId, userId: request.userId, role: "MEMBER" },
      }),
      prisma.teamJoinRequest.update({ where: { id: requestId }, data: { status: "ACCEPTED" } }),
    ]);
  } else {
    await prisma.teamJoinRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
  }

  return { status: accept ? "ACCEPTED" : "REJECTED" };
};

// Current user's own request status for a team (for the join page).
export const getMyJoinRequestStatus = async (userId, teamId) => {
  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (membership) return { state: "MEMBER" };
  const request = await prisma.teamJoinRequest.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return { state: request ? request.status : "NONE" };
};
