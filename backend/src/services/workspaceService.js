import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership, assertOwner } from "../utils/membership.js";

const shape = (workspace) => ({
  id: workspace.id,
  name: workspace.name,
  role: workspace.memberships?.[0]?.role,
  memberCount: workspace._count?.memberships,
  projectCount: workspace._count?.projects,
  createdAt: workspace.createdAt,
});

export const listForUser = async (userId) => {
  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    include: {
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { memberships: true, projects: true } },
    },
  });
  return workspaces.map(shape);
};

export const create = async (userId, { name }) => {
  if (!name?.trim()) throw new ApiError(400, "Workspace name is required");

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      memberships: { create: { userId, role: "OWNER" } },
    },
    include: {
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { memberships: true, projects: true } },
    },
  });
  return shape(workspace);
};

export const getById = async (userId, id) => {
  await assertMembership(userId, id);
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { memberships: true, projects: true } },
    },
  });
  if (!workspace) throw new ApiError(404, "Workspace not found");
  return shape(workspace);
};

export const update = async (userId, id, { name }) => {
  await assertOwner(userId, id);
  const workspace = await prisma.workspace.update({
    where: { id },
    data: { name: name?.trim() },
    include: {
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { memberships: true, projects: true } },
    },
  });
  return shape(workspace);
};

export const remove = async (userId, id) => {
  await assertOwner(userId, id);
  await prisma.workspace.delete({ where: { id } });
};
