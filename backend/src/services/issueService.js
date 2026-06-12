import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { getTeamOrThrow, getProjectOrThrow, getIssueOrThrow } from "../utils/access.js";

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
const PRIORITIES = ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"];

const include = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  labels: true,
  project: { select: { id: true, name: true, icon: true } },
  team: { select: { key: true } },
};

const shape = (issue) => ({
  ...issue,
  identifier: `${issue.team.key}-${issue.number}`,
  team: undefined,
});

const validate = (data) => {
  if (data.status && !STATUSES.includes(data.status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${STATUSES.join(", ")}`);
  }
  if (data.priority && !PRIORITIES.includes(data.priority)) {
    throw new ApiError(400, `Invalid priority. Use one of: ${PRIORITIES.join(", ")}`);
  }
};

export const listForTeam = async (userId, teamId) => {
  await getTeamOrThrow(userId, teamId);
  const issues = await prisma.issue.findMany({
    where: { teamId },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include,
  });
  return issues.map(shape);
};

export const listForProject = async (userId, projectId) => {
  const project = await getProjectOrThrow(userId, projectId);
  const issues = await prisma.issue.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include,
  });
  return { teamId: project.teamId, issues: issues.map(shape) };
};

export const create = async (userId, teamId, data) => {
  await getTeamOrThrow(userId, teamId);
  if (!data.title?.trim()) throw new ApiError(400, "Issue title is required");
  validate(data);

  const issue = await prisma.$transaction(async (tx) => {
    const team = await tx.team.update({
      where: { id: teamId },
      data: { issueCounter: { increment: 1 } },
    });
    return tx.issue.create({
      data: {
        teamId,
        number: team.issueCounter,
        title: data.title.trim(),
        description: data.description || null,
        status: data.status || "TODO",
        priority: data.priority || "NONE",
        projectId: data.projectId || null,
        assigneeId: data.assigneeId || null,
        labels: { connect: (data.labelIds || []).map((id) => ({ id })) },
      },
      include,
    });
  });
  return shape(issue);
};

export const getById = async (userId, id) => {
  await getIssueOrThrow(userId, id);
  const issue = await prisma.issue.findUnique({ where: { id }, include });
  return shape(issue);
};

export const update = async (userId, id, data) => {
  await getIssueOrThrow(userId, id);
  validate(data);

  const patch = {
    title: data.title?.trim(),
    description: data.description,
    status: data.status,
    priority: data.priority,
    projectId: data.projectId,
    assigneeId: data.assigneeId,
    sortOrder: data.sortOrder,
  };
  if (data.labelIds) patch.labels = { set: data.labelIds.map((x) => ({ id: x })) };

  const issue = await prisma.issue.update({ where: { id }, data: patch, include });
  return shape(issue);
};

export const remove = async (userId, id) => {
  await getIssueOrThrow(userId, id);
  await prisma.issue.delete({ where: { id } });
};
