import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership, assertOwner } from "../utils/membership.js";

const shapeWorkspace = (workspace) => ({
  id: workspace.id,
  name: workspace.name,
  logoUrl: workspace.logoUrl || null,
  role: workspace.memberships?.[0]?.role,
  memberCount: workspace._count?.memberships,
  teamCount: workspace._count?.teams,
  createdAt: workspace.createdAt,
});

const includeForUser = (userId) => ({
  memberships: { where: { userId }, select: { role: true } },
  _count: { select: { memberships: true, teams: true } },
});

export const getUserWorkspaces = async (userId) => {
  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    include: includeForUser(userId),
  });
  return workspaces.map(shapeWorkspace);
};

export const createWorkspace = async (userId, { name }) => {
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
    include: includeForUser(userId),
  });
  return shapeWorkspace(workspace);
};

export const getWorkspaceById = async (userId, id) => {
  await assertMembership(userId, id);
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: includeForUser(userId),
  });
  if (!workspace) throw new ApiError(404, "Workspace not found");
  return shapeWorkspace(workspace);
};

export const updateWorkspace = async (userId, id, { name, logoUrl }) => {
  await assertOwner(userId, id);
  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
    include: includeForUser(userId),
  });
  return shapeWorkspace(workspace);
};

export const deleteWorkspace = async (userId, id) => {
  await assertOwner(userId, id);
  await prisma.workspace.delete({ where: { id } });
};

// Search issues + projects across the user's teams in a workspace.
export const searchWorkspace = async (userId, workspaceId, q) => {
  await assertMembership(userId, workspaceId);
  const query = (q || "").trim();
  if (!query) return { issues: [], projects: [] };

  const teamFilter = { workspaceId, memberships: { some: { userId } } };

  const [issues, projects] = await Promise.all([
    prisma.issue.findMany({
      where: { team: teamFilter, title: { contains: query, mode: "insensitive" } },
      take: 30,
      orderBy: { updatedAt: "desc" },
      include: {
        team: { select: { key: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.project.findMany({
      where: { team: teamFilter, name: { contains: query, mode: "insensitive" } },
      take: 20,
      orderBy: { updatedAt: "desc" },
      include: { team: { select: { name: true } } },
    }),
  ]);

  return {
    issues: issues.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      priority: i.priority,
      identifier: `${i.team.key}-${i.number}`,
      assignee: i.assignee,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      icon: p.icon,
      color: p.color,
      teamName: p.team.name,
    })),
  };
};

// Workspace members (for member/lead/assignee pickers + Members page).
export const getWorkspaceMembers = async (userId, workspaceId) => {
  await assertMembership(userId, workspaceId);
  const memberships = await prisma.membership.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, lastSeenAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Which teams (keys) each member belongs to in this workspace.
  const userIds = memberships.map((m) => m.userId);
  const teamMems = await prisma.teamMembership.findMany({
    where: { userId: { in: userIds }, team: { workspaceId } },
    include: { team: { select: { id: true, name: true, key: true } } },
  });
  const teamsByUser = {};
  for (const tm of teamMems) {
    (teamsByUser[tm.userId] ||= []).push({ id: tm.team.id, name: tm.team.name, key: tm.team.key });
  }

  return memberships.map((m) => ({
    ...m.user,
    role: m.role,
    joinedAt: m.createdAt,
    teams: teamsByUser[m.userId] || [],
  }));
};
