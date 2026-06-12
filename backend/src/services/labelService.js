import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { getTeamOrThrow } from "../utils/access.js";

export const listForTeam = async (userId, teamId) => {
  await getTeamOrThrow(userId, teamId);
  return prisma.label.findMany({ where: { teamId }, orderBy: { name: "asc" } });
};

export const create = async (userId, teamId, { name, color }) => {
  await getTeamOrThrow(userId, teamId);
  if (!name?.trim()) throw new ApiError(400, "Label name is required");

  const existing = await prisma.label.findUnique({
    where: { teamId_name: { teamId, name: name.trim() } },
  });
  if (existing) return existing;

  return prisma.label.create({
    data: { teamId, name: name.trim(), color: color || "#5e6ad2" },
  });
};

export const remove = async (userId, id) => {
  const label = await prisma.label.findUnique({ where: { id }, include: { team: true } });
  if (!label) throw new ApiError(404, "Label not found");
  await getTeamOrThrow(userId, label.teamId);
  await prisma.label.delete({ where: { id } });
};
