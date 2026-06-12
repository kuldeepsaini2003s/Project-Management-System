import prisma from "../config/db.js";
import { ApiError } from "./ApiError.js";

/**
 * Ensure the user belongs to the workspace. Returns the membership
 * (with role) or throws 403/404.
 */
export const assertMembership = async (userId, workspaceId) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    throw new ApiError(403, "You don't have access to this workspace");
  }
  return membership;
};

export const assertOwner = async (userId, workspaceId) => {
  const membership = await assertMembership(userId, workspaceId);
  if (membership.role !== "OWNER") {
    throw new ApiError(403, "Only the workspace owner can do this");
  }
  return membership;
};

/**
 * Ensure the user is a member of the team. Returns the team membership
 * (with role) or throws 403.
 */
export const assertTeamMembership = async (userId, teamId) => {
  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!membership) {
    throw new ApiError(403, "You're not a member of this team");
  }
  return membership;
};

// Require team OWNER or ADMIN (for managing members / requests).
export const assertTeamAdmin = async (userId, teamId) => {
  const membership = await assertTeamMembership(userId, teamId);
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new ApiError(403, "Only team admins can do this");
  }
  return membership;
};
