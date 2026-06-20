import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership } from "../utils/membership.js";

// Labels are shared across all teams in a workspace.
export const getWorkspaceLabels = async (userId, workspaceId) => {
  await assertMembership(userId, workspaceId);
  const labels = await prisma.label.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { issues: true, projects: true } },
    },
  });
  return labels.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    workspaceId: l.workspaceId,
    issueCount: l._count.issues,
    projectCount: l._count.projects,
  }));
};

export const createLabel = async (userId, workspaceId, { name, color }) => {
  await assertMembership(userId, workspaceId);
  if (!name?.trim()) throw new ApiError(400, "Label name is required");

  const existing = await prisma.label.findUnique({
    where: { workspaceId_name: { workspaceId, name: name.trim() } },
  });
  if (existing) return existing;

  const label = await prisma.label.create({
    data: { workspaceId, name: name.trim(), color: color || "#5e6ad2" },
    include: { _count: { select: { issues: true, projects: true } } },
  });
  return { ...label, issueCount: label._count.issues, projectCount: label._count.projects };
};

export const updateLabel = async (userId, id, { name, color }) => {
  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) throw new ApiError(404, "Label not found");
  await assertMembership(userId, label.workspaceId);
  if (!name?.trim()) throw new ApiError(400, "Label name is required");

  const updated = await prisma.label.update({
    where: { id },
    data: { name: name.trim(), color: color || label.color },
    include: { _count: { select: { issues: true, projects: true } } },
  });
  return { ...updated, issueCount: updated._count.issues, projectCount: updated._count.projects };
};

export const deleteLabel = async (userId, id) => {
  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) throw new ApiError(404, "Label not found");
  await assertMembership(userId, label.workspaceId);
  await prisma.label.delete({ where: { id } });
};
