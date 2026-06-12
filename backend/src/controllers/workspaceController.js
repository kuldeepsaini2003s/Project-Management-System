import { asyncHandler } from "../utils/asyncHandler.js";
import * as workspaceService from "../services/workspaceService.js";
import * as teamService from "../services/teamService.js";

export const getWorkspaces = asyncHandler(async (req, res) => {
  res.json(await workspaceService.listForUser(req.userId));
});

export const createWorkspace = asyncHandler(async (req, res) => {
  res.status(201).json(await workspaceService.create(req.userId, req.body));
});

export const getWorkspace = asyncHandler(async (req, res) => {
  res.json(await workspaceService.getById(req.userId, req.params.id));
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  res.json(await workspaceService.update(req.userId, req.params.id, req.body));
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.remove(req.userId, req.params.id);
  res.status(204).send();
});

export const getMembers = asyncHandler(async (req, res) => {
  res.json(await workspaceService.listMembers(req.userId, req.params.id));
});

export const getWorkspaceTeams = asyncHandler(async (req, res) => {
  res.json(await teamService.listForWorkspace(req.userId, req.params.id));
});

export const createWorkspaceTeam = asyncHandler(async (req, res) => {
  res.status(201).json(await teamService.create(req.userId, req.params.id, req.body));
});
