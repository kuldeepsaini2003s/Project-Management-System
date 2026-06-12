import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership } from "../utils/membership.js";

const STATUSES = ["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const include = {
  lead: { select: { id: true, name: true, avatarUrl: true } },
};

const validateStatus = (status) => {
  if (status && !STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${STATUSES.join(", ")}`);
  }
};

export const listForWorkspace = async (userId, workspaceId) => {
  await assertMembership(userId, workspaceId);
  return prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include,
  });
};

export const create = async (userId, workspaceId, data) => {
  await assertMembership(userId, workspaceId);
  if (!data.name?.trim()) throw new ApiError(400, "Project name is required");
  validateStatus(data.status);

  return prisma.project.create({
    data: {
      workspaceId,
      name: data.name.trim(),
      description: data.description || null,
      icon: data.icon || null,
      color: data.color || null,
      status: data.status || "BACKLOG",
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      leadId: data.leadId || null,
    },
    include,
  });
};

const getOwnedProject = async (userId, id) => {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new ApiError(404, "Project not found");
  await assertMembership(userId, project.workspaceId);
  return project;
};

export const getById = async (userId, id) => {
  await getOwnedProject(userId, id);
  return prisma.project.findUnique({ where: { id }, include });
};

export const update = async (userId, id, data) => {
  await getOwnedProject(userId, id);
  validateStatus(data.status);

  return prisma.project.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      description: data.description,
      icon: data.icon,
      color: data.color,
      status: data.status,
      targetDate:
        data.targetDate === undefined
          ? undefined
          : data.targetDate
            ? new Date(data.targetDate)
            : null,
      leadId: data.leadId,
    },
    include,
  });
};

export const remove = async (userId, id) => {
  await getOwnedProject(userId, id);
  await prisma.project.delete({ where: { id } });
};
