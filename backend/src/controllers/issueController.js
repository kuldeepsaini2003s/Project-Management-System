import { asyncHandler } from "../utils/asyncHandler.js";
import * as issueService from "../services/issueService.js";

export const getIssue = asyncHandler(async (req, res) => {
  res.json(await issueService.getById(req.userId, req.params.id));
});

export const updateIssue = asyncHandler(async (req, res) => {
  res.json(await issueService.update(req.userId, req.params.id, req.body));
});

export const deleteIssue = asyncHandler(async (req, res) => {
  await issueService.remove(req.userId, req.params.id);
  res.status(204).send();
});
