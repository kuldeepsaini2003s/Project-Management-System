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
