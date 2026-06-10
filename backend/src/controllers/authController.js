import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const google = asyncHandler(async (req, res) => {
  const result = await authService.googleAuth(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.userId);
  res.json(user);
});
