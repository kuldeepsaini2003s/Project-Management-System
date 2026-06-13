import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership } from "../utils/membership.js";

// Labels are shared across all teams in a workspace.
export const getWorkspaceLabels = async (userId, workspaceId) => {
  await assertMembership(userId, workspaceId);
  return prisma.label.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
};

export const createLabel = async (userId, workspaceId, { name, color }) => {
  await assertMembership(userId, workspaceId);
  if (!name?.trim()) throw new ApiError(400, "Label name is required");

  const existing = await prisma.label.findUnique({
    where: { workspaceId_name: { workspaceId, name: name.trim() } },
  });
  if (existing) return existing;

  return prisma.label.create({
    data: { workspaceId, name: name.trim(), color: color || "#5e6ad2" },
  });
};

export const deleteLabel = async (userId, id) => {
  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) throw new ApiError(404, "Label not found");
  await assertMembership(userId, label.workspaceId);
  await prisma.label.delete({ where: { id } });
};
