import prisma from "../db/index.js";
import { emitToUser } from "../config/socket.js";

export const createNotification = async (userId, { type, title, body = null, link = null }) => {
  if (!userId) return null;
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });
  emitToUser(userId, "notification:new", notification);
  const unread = await prisma.notification.count({ where: { userId, read: false } });
  emitToUser(userId, "notification:count", { unread });
  return notification;
};

export const getNotifications = async (userId) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

export const getUnreadCount = async (userId) =>
  prisma.notification.count({ where: { userId, read: false } });

export const markRead = async (userId, id) => {
  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  return { ok: true };
};

export const markAllRead = async (userId) => {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return { ok: true };
};
