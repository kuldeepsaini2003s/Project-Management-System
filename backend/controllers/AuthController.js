import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/AuthService.js";

const getClientInfo = (req) => ({
  userAgent: req.headers["user-agent"] || null,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser({ ...req.body, ...getClientInfo(req) });
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser({ ...req.body, ...getClientInfo(req) });
  res.json(result);
});

export const google = asyncHandler(async (req, res) => {
  const result = await authService.authenticateWithGoogle({ ...req.body, ...getClientInfo(req) });
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUserProfile(req.userId);
  res.json(user);
});

// Explicit sign-out — deletes the session row server-side (previously logout
// only cleared the token from localStorage, so the session kept showing on
// the Security page as if still logged in, and the token itself stayed
// technically valid for its full 7-day life since nothing on the server ever
// knew you'd signed out).
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutSession(req.sessionId);
  res.status(204).send();
});
