import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as userService from "../services/UserService.js";

export const getUsers = asyncHandler(async (req, res) => {
  res.json(await userService.getAllUsers());
});

export const getUser = asyncHandler(async (req, res) => {
  res.json(await userService.getUserById(req.params.id));
});

export const updateUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "You can only update your own profile");
  res.json(await userService.updateUser(req.params.id, req.body));
});

export const changeEmail = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "You can only update your own profile");
  res.json(await userService.changeEmail(req.params.id, req.body));
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "You can only delete your own account");
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});


export const getSessions = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "Forbidden");
  const sessions = await userService.getUserSessions(req.userId);
  res.json(sessions.map((s) => ({ ...s, isCurrent: s.sessionId === req.sessionId })));
});

export const revokeSession = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "Forbidden");
  await userService.revokeSession(req.userId, req.params.sessionId);
  res.status(204).send();
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) throw new ApiError(403, "Forbidden");
  await userService.revokeAllOtherSessions(req.userId, req.sessionId);
  res.status(204).send();
});
