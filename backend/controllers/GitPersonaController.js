import { asyncHandler } from "../utils/asyncHandler.js";
import * as gitPersonaService from "../services/GitPersonaService.js";

// No connect/disconnect here — GitPersona has no connection of its own. It
// reads the same GithubConnection created from Settings → Connected accounts,
// so connecting GitHub on either page reflects on both automatically.

export const getCard = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getCard(req.userId));
});

export const generateCard = asyncHandler(async (req, res) => {
  res.status(201).json(await gitPersonaService.generateCard(req.userId));
});

export const setVisibility = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.setCardVisibility(req.userId, req.body.public));
});

// Public, unauthenticated — powers the shareable /dev/:login page.
export const getPublicCard = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getPublicCard(req.params.login));
});
