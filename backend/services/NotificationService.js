import prisma from "../db/index.js";
import { emitToUser } from "../config/socket.js";

// Create a notification, persist it, and push it in real time to the recipient.
export const createNotification = async (userId, { type, title, body = null, link = null }) => {
  if (!userId) return null;
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });
  emitToUser(userId, "notification:new", notification);
  // Also push the fresh unread count so badges update instantly.
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
