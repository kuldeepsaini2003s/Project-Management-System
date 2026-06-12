import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { getTeamOrThrow, getProjectOrThrow } from "../utils/access.js";

const STATUSES = ["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITIES = ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"];

const include = {
  lead: { select: { id: true, name: true, avatarUrl: true } },
  members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  labels: true,
  milestones: { orderBy: { sortOrder: "asc" } },
  dependsOn: { select: { id: true, name: true, icon: true } },
  _count: { select: { issues: true } },
};

const shape = (p) => ({
  ...p,
  members: p.members?.map((m) => m.user) || [],
  issueCount: p._count?.issues,
  _count: undefined,
});

const validate = (data) => {
  if (data.status && !STATUSES.includes(data.status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${STATUSES.join(", ")}`);
  }
  if (data.priority && !PRIORITIES.includes(data.priority)) {
    throw new ApiError(400, `Invalid priority. Use one of: ${PRIORITIES.join(", ")}`);
  }
};

const toDate = (v) => (v ? new Date(v) : null);

export const listForTeam = async (userId, teamId) => {
  await getTeamOrThrow(userId, teamId);
  const projects = await prisma.project.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    include,
  });
  return projects.map(shape);
};

export const create = async (userId, teamId, data) => {
  await getTeamOrThrow(userId, teamId);
  if (!data.name?.trim()) throw new ApiError(400, "Project name is required");
  validate(data);

  const project = await prisma.project.create({
    data: {
      teamId,
      name: data.name.trim(),
      summary: data.summary || null,
      description: data.description || null,
      icon: data.icon || null,
      color: data.color || null,
      status: data.status || "BACKLOG",
      priority: data.priority || "NONE",
      startDate: toDate(data.startDate),
      targetDate: toDate(data.targetDate),
      leadId: data.leadId || null,
      members: { create: (data.memberIds || []).map((id) => ({ userId: id })) },
      labels: { connect: (data.labelIds || []).map((id) => ({ id })) },
      dependsOn: { connect: (data.dependsOnIds || []).map((id) => ({ id })) },
      milestones: {
        create: (data.milestones || []).map((m, i) => ({
          name: m.name,
          targetDate: toDate(m.targetDate),
          sortOrder: i,
        })),
      },
    },
    include,
  });
  return shape(project);
};

export const getById = async (userId, id) => {
  await getProjectOrThrow(userId, id);
  const project = await prisma.project.findUnique({ where: { id }, include });
  return shape(project);
};

export const update = async (userId, id, data) => {
  await getProjectOrThrow(userId, id);
  validate(data);

  const scalar = {
    name: data.name?.trim(),
    summary: data.summary,
    description: data.description,
    icon: data.icon,
    color: data.color,
    status: data.status,
    priority: data.priority,
    startDate: data.startDate === undefined ? undefined : toDate(data.startDate),
    targetDate: data.targetDate === undefined ? undefined : toDate(data.targetDate),
    leadId: data.leadId,
  };

  if (data.labelIds) scalar.labels = { set: data.labelIds.map((x) => ({ id: x })) };
  if (data.dependsOnIds) scalar.dependsOn = { set: data.dependsOnIds.map((x) => ({ id: x })) };

  await prisma.$transaction(async (tx) => {
    if (data.memberIds) {
      await tx.projectMember.deleteMany({ where: { projectId: id } });
      await tx.projectMember.createMany({
        data: data.memberIds.map((uid) => ({ projectId: id, userId: uid })),
        skipDuplicates: true,
      });
    }
    if (data.milestones) {
      await tx.milestone.deleteMany({ where: { projectId: id } });
      if (data.milestones.length) {
        await tx.milestone.createMany({
          data: data.milestones.map((m, i) => ({
            projectId: id,
            name: m.name,
            targetDate: toDate(m.targetDate),
            sortOrder: i,
          })),
        });
      }
    }
    await tx.project.update({ where: { id }, data: scalar });
  });

  const project = await prisma.project.findUnique({ where: { id }, include });
  return shape(project);
};

export const remove = async (userId, id) => {
  await getProjectOrThrow(userId, id);
  await prisma.project.delete({ where: { id } });
};
