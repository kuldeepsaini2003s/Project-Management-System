import { asyncHandler } from "../utils/asyncHandler.js";
import * as projectService from "../services/projectService.js";

export const getProjects = asyncHandler(async (req, res) => {
  res.json(await projectService.listForWorkspace(req.userId, req.params.workspaceId));
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.create(
    req.userId,
    req.params.workspaceId,
    req.body
  );
  res.status(201).json(project);
});

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
