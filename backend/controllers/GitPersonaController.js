import { asyncHandler } from "../utils/asyncHandler.js";
import * as gitPersonaService from "../services/GitPersonaService.js";

// No connect/disconnect here — GitPersona has no connection of its own. It
// reads the same GithubConnection created from Settings → Connected accounts,
// so connecting GitHub on either page reflects on both automatically.

export const getCard = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getCard(req.userId));
});

// Kicks off generation and returns immediately (202) — does NOT wait for the
// 15-30s GitHub+AI pipeline to finish. Safe to call repeatedly: if one is
// already running for this user it just reports that instead of starting a
// duplicate. Poll GET /card/status for progress.
export const generateCard = asyncHandler(async (req, res) => {
  res.status(202).json(await gitPersonaService.startGenerateCard(req.userId));
});

export const getGenerationStatus = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getGenerationStatus(req.userId));
});

export const setVisibility = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.setCardVisibility(req.userId, req.body.public));
});

// Public, unauthenticated — powers the shareable /dev/:login page.
export const getPublicCard = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getPublicCard(req.params.login));
});
