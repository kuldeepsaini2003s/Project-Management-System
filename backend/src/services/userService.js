import prisma from "../config/db.js";

export const findAll = () =>
  prisma.user.findMany({ orderBy: { id: "asc" }, include: { posts: true } });

export const findById = (id) =>
  prisma.user.findUnique({ where: { id }, include: { posts: true } });

export const create = (data) => prisma.user.create({ data });

export const update = (id, data) => prisma.user.update({ where: { id }, data });

export const remove = (id) => prisma.user.delete({ where: { id } });
