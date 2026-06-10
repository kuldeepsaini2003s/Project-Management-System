import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

const SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
};

export const findAll = () =>
  prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: SELECT });

export const findById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: SELECT });
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const update = async (id, data) => {
  await findById(id); // ensures it exists (throws 404 otherwise)
  const { name, avatarUrl } = data;
  return prisma.user.update({
    where: { id },
    data: { name, avatarUrl },
    select: SELECT,
  });
};

export const remove = async (id) => {
  await findById(id);
  await prisma.user.delete({ where: { id } });
};
