import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertMembership } from "../utils/membership.js";
import { getTeamOrThrow } from "../utils/access.js";
import { uniqueTeamKey } from "../utils/teamKey.js";

const includeForUser = (userId) => ({
  memberships: userId ? { where: { userId }, select: { role: true } } : false,
  _count: { select: { projects: true, issues: true, memberships: true } },
});

const shapeTeam = (team) => ({
  id: team.id,
  name: team.name,
  key: team.key,
  icon: team.icon,
  color: team.color,
  description: team.description,
  workspaceId: team.workspaceId,
  role: team.memberships?.[0]?.role,
  projectCount: team._count?.projects,
  issueCount: team._count?.issues,
  memberCount: team._count?.memberships,
  createdAt: team.createdAt,
});

// Teams in the workspace that the user is actually a member of (rich shape for lists).
export const getWorkspaceTeams = async (userId, workspaceId) => {
  await assertMembership(userId, workspaceId);
  const teams = await prisma.team.findMany({
    where: { workspaceId, memberships: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      _count: { select: { memberships: true } },
      projects: { where: { status: { notIn: ["COMPLETED", "CANCELLED"] } }, select: { id: true } },
    },
  });
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    key: team.key,
    icon: team.icon,
    color: team.color,
    description: team.description,
    workspaceId: team.workspaceId,
    role: team.memberships.find((m) => m.userId === userId)?.role,
    memberCount: team._count.memberships,
    members: team.memberships.slice(0, 5).map((m) => m.user),
    activeProjectCount: team.projects.length,
    createdAt: team.createdAt,
  }));
};

export const createTeam = async (userId, workspaceId, { name, icon, color, key }) => {
  await assertMembership(userId, workspaceId);
  if (!name?.trim()) throw new ApiError(400, "Team name is required");

  const finalKey = key?.trim()
    ? key.trim().toUpperCase().slice(0, 6)
    : await uniqueTeamKey(workspaceId, name);

  const exists = await prisma.team.findUnique({
    where: { workspaceId_key: { workspaceId, key: finalKey } },
  });
  if (exists) throw new ApiError(409, `Team key "${finalKey}" is already used`);

  const team = await prisma.team.create({
    data: {
      workspaceId,
      name: name.trim(),
      key: finalKey,
      icon: icon || null,
      color: color || "#5e6ad2",
      memberships: { create: { userId, role: "OWNER" } },
    },
    include: includeForUser(userId),
  });
  return shapeTeam(team);
};

export const getTeamById = async (userId, id) => {
  await getTeamOrThrow(userId, id);
  const team = await prisma.team.findUnique({ where: { id }, include: includeForUser(userId) });
  return shapeTeam(team);
};

export const updateTeam = async (userId, id, data) => {
  await getTeamOrThrow(userId, id);
  const team = await prisma.team.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      icon: data.icon,
      color: data.color,
      description: data.description,
    },
    include: includeForUser(userId),
  });
  return shapeTeam(team);
};

export const deleteTeam = async (userId, id) => {
  await getTeamOrThrow(userId, id);
  await prisma.team.delete({ where: { id } });
};

// Minimal public info for the "request to join" page (no membership required).
export const getTeamPublicInfo = async (id) => {
  const team = await prisma.team.findUnique({
    where: { id },
    include: { workspace: { select: { name: true } }, _count: { select: { memberships: true } } },
  });
  if (!team) throw new ApiError(404, "Team not found");
  return {
    id: team.id,
    name: team.name,
    key: team.key,
    icon: team.icon,
    color: team.color,
    workspaceName: team.workspace.name,
    memberCount: team._count.memberships,
  };
};
