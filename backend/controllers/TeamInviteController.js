import { asyncHandler } from "../utils/asyncHandler.js";
import * as teamInviteService from "../services/TeamInviteService.js";

// POST /api/teams/:id/invites  (admin)
export const createInvites = asyncHandler(async (req, res) => {
  res.status(201).json(
    await teamInviteService.createTeamInvites(
      req.userId,
      req.params.id,
      req.body.emails,
      req.body.role
    )
  );
});

// GET /api/invites/:token  (public)
export const getInvite = asyncHandler(async (req, res) => {
  res.json(await teamInviteService.getInviteByToken(req.params.token));
});

// POST /api/invites/:token/accept  (authenticated)
export const acceptInvite = asyncHandler(async (req, res) => {
  res.json(await teamInviteService.acceptInvite(req.userId, req.params.token));
});
