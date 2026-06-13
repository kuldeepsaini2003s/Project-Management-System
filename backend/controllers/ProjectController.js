import { asyncHandler } from "../utils/asyncHandler.js";
import * as projectService from "../services/ProjectService.js";
import * as issueService from "../services/IssueService.js";

export const getProject = asyncHandler(async (req, res) => {
  res.json(await projectService.getProjectById(req.userId, req.params.id));
});

export const updateProject = asyncHandler(async (req, res) => {
  res.json(await projectService.updateProject(req.userId, req.params.id, req.body));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.userId, req.params.id);
  res.status(204).send();
});

export const getProjectIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.getProjectIssues(req.userId, req.params.id));
});
