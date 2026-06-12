import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership, assertOwner } from "../utils/membership.js";

const include = {
  memberships: { where: {}, select: { role: true } },
  _count: { select: { memberships: true, teams: true } },
};

const shape = (workspace) => ({
  id: workspace.id,
  name: workspace.name,
  role: workspace.memberships?.[0]?.role,
  memberCount: workspace._count?.memberships,
  teamCount: workspace._count?.teams,
  createdAt: workspace.createdAt,
});

const includeFor = (userId) => ({
  memberships: { where: { userId }, select: { role: true } },
  _count: { select: { memberships: true, teams: true } },
});

export const listForUser = async (userId) => {
  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    include: includeFor(userId),
  });
  return workspaces.map(shape);
};

export const create = async (userId, { name }) => {
  if (!name?.trim()) throw new ApiError(400, "Workspace name is required");

  const clean = name.trim();
  const key = (clean.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "TEAM").padEnd(2, "X");
  const workspace = await prisma.workspace.create({
    data: {
      name: clean,
      memberships: { create: { userId, role: "OWNER" } },
      teams: {
        create: {
          name: clean,
          key,
          color: "#5e6ad2",
          memberships: { create: { userId, role: "OWNER" } },
        },
      },
    },
    include: includeFor(userId),
  });
  return shape(workspace);
};

export const getById = async (userId, id) => {
  await assertMembership(userId, id);
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: includeFor(userId),
  });
  if (!workspace) throw new ApiError(404, "Workspace not found");
  return shape(workspace);
};

export const update = async (userId, id, { name }) => {
  await assertOwner(userId, id);
  const workspace = await prisma.workspace.update({
    where: { id },
    data: { name: name?.trim() },
    include: includeFor(userId),
  });
  return shape(workspace);
};

export const remove = async (userId, id) => {
  await assertOwner(userId, id);
  await prisma.workspace.delete({ where: { id } });
};

// Workspace members (for member/lead/assignee pickers).
export const listMembers = async (userId, workspaceId) => {
  await assertMembership(userId, workspaceId);
  const memberships = await prisma.membership.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({ ...m.user, role: m.role }));
};
