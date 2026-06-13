import { asyncHandler } from "../utils/asyncHandler.js";
import * as workspaceService from "../services/WorkspaceService.js";
import * as teamService from "../services/TeamService.js";
import * as projectService from "../services/ProjectService.js";

export const getWorkspaces = asyncHandler(async (req, res) => {
  res.json(await workspaceService.getUserWorkspaces(req.userId));
});

export const createWorkspace = asyncHandler(async (req, res) => {
  res.status(201).json(await workspaceService.createWorkspace(req.userId, req.body));
});

export const getWorkspace = asyncHandler(async (req, res) => {
  res.json(await workspaceService.getWorkspaceById(req.userId, req.params.id));
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  res.json(await workspaceService.updateWorkspace(req.userId, req.params.id, req.body));
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace(req.userId, req.params.id);
  res.status(204).send();
});

export const getMembers = asyncHandler(async (req, res) => {
  res.json(await workspaceService.getWorkspaceMembers(req.userId, req.params.id));
});

export const getWorkspaceTeams = asyncHandler(async (req, res) => {
  res.json(await teamService.getWorkspaceTeams(req.userId, req.params.id));
});

export const createWorkspaceTeam = asyncHandler(async (req, res) => {
  res.status(201).json(await teamService.createTeam(req.userId, req.params.id, req.body));
});

export const getWorkspaceProjects = asyncHandler(async (req, res) => {
  res.json(await projectService.getWorkspaceProjects(req.userId, req.params.id));
});
