import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/NotificationService.js";

export const listNotifications = asyncHandler(async (req, res) => {
  res.json(await notificationService.getNotifications(req.userId));
});

export const unreadCount = asyncHandler(async (req, res) => {
  res.json({ unread: await notificationService.getUnreadCount(req.userId) });
});

export const readOne = asyncHandler(async (req, res) => {
  res.json(await notificationService.markRead(req.userId, req.params.id));
});

export const readAll = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.userId));
});
