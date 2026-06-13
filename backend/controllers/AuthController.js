import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/AuthService.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json(result);
});

export const google = asyncHandler(async (req, res) => {
  const result = await authService.authenticateWithGoogle(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUserProfile(req.userId);
  res.json(user);
});
