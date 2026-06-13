import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { getTeamOrThrow, getProjectOrThrow, getIssueOrThrow } from "../utils/access.js";

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
const PRIORITIES = ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"];

const userSel = { select: { id: true, name: true, avatarUrl: true } };

// Light shape for board/list views.
const include = {
  assignee: userSel,
  labels: true,
  project: { select: { id: true, name: true, icon: true } },
  team: { select: { key: true } },
};

// Rich shape for the issue detail page.
const detailInclude = {
  assignee: userSel,
  createdBy: userSel,
  labels: true,
  project: { select: { id: true, name: true, icon: true } },
  team: { select: { id: true, key: true, name: true, workspaceId: true } },
  parent: { select: { id: true, number: true, title: true, team: { select: { key: true } } } },
  children: {
    include: { assignee: userSel, team: { select: { key: true } } },
    orderBy: { createdAt: "asc" },
  },
  comments: {
    include: { author: userSel },
    orderBy: { createdAt: "asc" },
  },
};

const buildIdentifier = (key, number) => `${key}-${number}`;

const shapeIssue = (issue) => ({
  ...issue,
  identifier: buildIdentifier(issue.team.key, issue.number),
  team: undefined,
});

const shapeIssueDetail = (issue) => ({
  ...issue,
  identifier: buildIdentifier(issue.team.key, issue.number),
  teamId: issue.team.id,
  teamKey: issue.team.key,
  teamName: issue.team.name,
  workspaceId: issue.team.workspaceId,
  team: undefined,
  parent: issue.parent
    ? {
        ...issue.parent,
        identifier: buildIdentifier(issue.parent.team.key, issue.parent.number),
        team: undefined,
      }
    : null,
  children: (issue.children || []).map((c) => ({
    ...c,
    identifier: buildIdentifier(c.team.key, c.number),
    team: undefined,
  })),
});

const validateIssueInput = (data) => {
  if (data.status && !STATUSES.includes(data.status)) {
    throw new ApiError(400, `Invalid status. Use one of: ${STATUSES.join(", ")}`);
  }
  if (data.priority && !PRIORITIES.includes(data.priority)) {
    throw new ApiError(400, `Invalid priority. Use one of: ${PRIORITIES.join(", ")}`);
  }
};

export const getTeamIssues = async (userId, teamId) => {
  await getTeamOrThrow(userId, teamId);
  const issues = await prisma.issue.findMany({
    where: { teamId, parentId: null },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include,
  });
  return issues.map(shapeIssue);
};

// Issues created by the current user, across all their teams.
export const getIssuesCreatedByUser = async (userId) => {
  const issues = await prisma.issue.findMany({
    where: { createdById: userId },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include,
  });
  return issues.map(shapeIssue);
};

export const getProjectIssues = async (userId, projectId) => {
  const project = await getProjectOrThrow(userId, projectId);
  const issues = await prisma.issue.findMany({
    where: { projectId, parentId: null },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include,
  });
  return { teamId: project.teamId, issues: issues.map(shapeIssue) };
};

export const createIssue = async (userId, teamId, data) => {
  await getTeamOrThrow(userId, teamId);
  if (!data.title?.trim()) throw new ApiError(400, "Issue title is required");
  validateIssueInput(data);

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
        parentId: data.parentId || null,
        createdById: userId,
        labels: { connect: (data.labelIds || []).map((id) => ({ id })) },
      },
      include,
    });
  });
  return shapeIssue(issue);
};

export const getIssueById = async (userId, id) => {
  await getIssueOrThrow(userId, id);
  const issue = await prisma.issue.findUnique({ where: { id }, include: detailInclude });
  return shapeIssueDetail(issue);
};

export const updateIssue = async (userId, id, data) => {
  await getIssueOrThrow(userId, id);
  validateIssueInput(data);

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

  await prisma.issue.update({ where: { id }, data: patch });
  return getIssueById(userId, id);
};

export const deleteIssue = async (userId, id) => {
  await getIssueOrThrow(userId, id);
  await prisma.issue.delete({ where: { id } });
};

/* ----- sub-issues ----- */
export const createSubIssue = async (userId, parentId, data) => {
  const parent = await getIssueOrThrow(userId, parentId);
  return createIssue(userId, parent.teamId, {
    ...data,
    parentId,
    projectId: data.projectId ?? parent.projectId,
  });
};

/* ----- comments ----- */
export const addCommentToIssue = async (userId, issueId, body) => {
  await getIssueOrThrow(userId, issueId);
  if (!body?.trim()) throw new ApiError(400, "Comment cannot be empty");
  const comment = await prisma.comment.create({
    data: { issueId, authorId: userId, body: body.trim() },
    include: { author: userSel },
  });
  return comment;
};

export const deleteComment = async (userId, commentId) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(404, "Comment not found");
  await getIssueOrThrow(userId, comment.issueId);
  if (comment.authorId !== userId) {
    throw new ApiError(403, "You can only delete your own comments");
  }
  await prisma.comment.delete({ where: { id: commentId } });
};

/* ----- image attachments ----- */
export const addIssueImages = async (userId, issueId, urls) => {
  await getIssueOrThrow(userId, issueId);
  if (!urls?.length) throw new ApiError(400, "No image was uploaded");
  await prisma.issue.update({ where: { id: issueId }, data: { images: { push: urls } } });
  return getIssueById(userId, issueId);
};

export const removeIssueImage = async (userId, issueId, url) => {
  const issue = await getIssueOrThrow(userId, issueId);
  const images = (issue.images || []).filter((u) => u !== url);
  await prisma.issue.update({ where: { id: issueId }, data: { images: { set: images } } });
  return getIssueById(userId, issueId);
};
