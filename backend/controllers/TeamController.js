import { asyncHandler } from "../utils/asyncHandler.js";
import * as teamService from "../services/TeamService.js";
import * as projectService from "../services/ProjectService.js";
import * as issueService from "../services/IssueService.js";
import * as labelService from "../services/LabelService.js";

export const getTeams = asyncHandler(async (req, res) => {
  res.json(await teamService.getWorkspaceTeams(req.userId, req.params.workspaceId));
});

export const createTeam = asyncHandler(async (req, res) => {
  res.status(201).json(await teamService.createTeam(req.userId, req.params.workspaceId, req.body));
});

export const getTeam = asyncHandler(async (req, res) => {
  res.json(await teamService.getTeamById(req.userId, req.params.id));
});

export const updateTeam = asyncHandler(async (req, res) => {
  res.json(await teamService.updateTeam(req.userId, req.params.id, req.body));
});

export const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.userId, req.params.id);
  res.status(204).send();
});

// Team-scoped collections
export const getTeamProjects = asyncHandler(async (req, res) => {
  res.json(await projectService.getTeamProjects(req.userId, req.params.id));
});

export const createTeamProject = asyncHandler(async (req, res) => {
  res.status(201).json(await projectService.createProject(req.userId, req.params.id, req.body));
});

export const getTeamIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.getTeamIssues(req.userId, req.params.id));
});

export const createTeamIssue = asyncHandler(async (req, res) => {
  res.status(201).json(await issueService.createIssue(req.userId, req.params.id, req.body));
});

export const getTeamLabels = asyncHandler(async (req, res) => {
  res.json(await labelService.getTeamLabels(req.userId, req.params.id));
});

export const createTeamLabel = asyncHandler(async (req, res) => {
  res.status(201).json(await labelService.createLabel(req.userId, req.params.id, req.body));
});
