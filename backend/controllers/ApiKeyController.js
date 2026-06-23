import { asyncHandler } from "../utils/asyncHandler.js";
import * as apiKeyService from "../services/ApiKeyService.js";

export const create = asyncHandler(async (req, res) => {
  const { name } = req.body;
  res.status(201).json(await apiKeyService.createApiKey(req.userId, name));
});

export const list = asyncHandler(async (req, res) => {
  res.json(await apiKeyService.listApiKeys(req.userId));
});

export const revoke = asyncHandler(async (req, res) => {
  res.json(await apiKeyService.revokeApiKey(req.userId, req.params.keyId));
});
