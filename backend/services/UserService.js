import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
};

export const getAllUsers = () =>
  prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: PUBLIC_USER_FIELDS });

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_FIELDS });
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateUser = async (id, data) => {
  await getUserById(id); // ensures it exists (throws 404 otherwise)
  const { name, avatarUrl } = data;
  return prisma.user.update({
    where: { id },
    data: { name, avatarUrl },
    select: PUBLIC_USER_FIELDS,
  });
};

export const deleteUser = async (id) => {
  await getUserById(id);
  await prisma.user.delete({ where: { id } });
};
