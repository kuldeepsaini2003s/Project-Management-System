import { asyncHandler } from "../utils/asyncHandler.js";
import * as issueService from "../services/IssueService.js";

export const getMyIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.getIssuesCreatedByUser(req.userId));
});

export const getIssue = asyncHandler(async (req, res) => {
  res.json(await issueService.getIssueById(req.userId, req.params.id));
});

export const updateIssue = asyncHandler(async (req, res) => {
  res.json(await issueService.updateIssue(req.userId, req.params.id, req.body));
});

export const deleteIssue = asyncHandler(async (req, res) => {
  await issueService.deleteIssue(req.userId, req.params.id);
  res.status(204).send();
});

export const createSubIssue = asyncHandler(async (req, res) => {
  res.status(201).json(await issueService.createSubIssue(req.userId, req.params.id, req.body));
});

export const addComment = asyncHandler(async (req, res) => {
  res.status(201).json(await issueService.addCommentToIssue(req.userId, req.params.id, req.body.body));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await issueService.deleteComment(req.userId, req.params.id);
  res.status(204).send();
});
