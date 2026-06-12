import { asyncHandler } from "../utils/asyncHandler.js";
import * as projectService from "../services/projectService.js";
import * as issueService from "../services/issueService.js";

export const getProject = asyncHandler(async (req, res) => {
  res.json(await projectService.getById(req.userId, req.params.id));
});

export const updateProject = asyncHandler(async (req, res) => {
  res.json(await projectService.update(req.userId, req.params.id, req.body));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.remove(req.userId, req.params.id);
  res.status(204).send();
});

export const getProjectIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.listForProject(req.userId, req.params.id));
});
