import { asyncHandler } from "../utils/asyncHandler.js";
import * as gitPersonaService from "../services/GitPersonaService.js";

export const getCard = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getCard(req.userId));
});

export const generateCard = asyncHandler(async (req, res) => {
  res.status(202).json(await gitPersonaService.startGenerateCard(req.userId));
});

export const getGenerationStatus = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getGenerationStatus(req.userId));
});

export const setVisibility = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.setCardVisibility(req.userId, req.body.public));
});

export const getPublicCard = asyncHandler(async (req, res) => {
  res.json(await gitPersonaService.getPublicCard(req.params.login));
});
