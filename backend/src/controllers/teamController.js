import { asyncHandler } from "../utils/asyncHandler.js";
import * as teamService from "../services/teamService.js";
import * as projectService from "../services/projectService.js";
import * as issueService from "../services/issueService.js";
import * as labelService from "../services/labelService.js";

export const getTeams = asyncHandler(async (req, res) => {
  res.json(await teamService.listForWorkspace(req.userId, req.params.workspaceId));
});

export const createTeam = asyncHandler(async (req, res) => {
  res.status(201).json(await teamService.create(req.userId, req.params.workspaceId, req.body));
});

export const getTeam = asyncHandler(async (req, res) => {
  res.json(await teamService.getById(req.userId, req.params.id));
});

export const updateTeam = asyncHandler(async (req, res) => {
  res.json(await teamService.update(req.userId, req.params.id, req.body));
});

export const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.remove(req.userId, req.params.id);
  res.status(204).send();
});

// Team-scoped collections
export const getTeamProjects = asyncHandler(async (req, res) => {
  res.json(await projectService.listForTeam(req.userId, req.params.id));
});

export const createTeamProject = asyncHandler(async (req, res) => {
  res.status(201).json(await projectService.create(req.userId, req.params.id, req.body));
});

export const getTeamIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.listForTeam(req.userId, req.params.id));
});

export const createTeamIssue = asyncHandler(async (req, res) => {
  res.status(201).json(await issueService.create(req.userId, req.params.id, req.body));
});

export const getTeamLabels = asyncHandler(async (req, res) => {
  res.json(await labelService.listForTeam(req.userId, req.params.id));
});

export const createTeamLabel = asyncHandler(async (req, res) => {
  res.status(201).json(await labelService.create(req.userId, req.params.id, req.body));
});
