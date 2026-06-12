import prisma from "../config/db.js";
import { ApiError } from "./ApiError.js";
import { assertTeamMembership } from "./membership.js";

// Load a team and ensure the user is a member of it.
export const getTeamOrThrow = async (userId, teamId) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new ApiError(404, "Team not found");
  await assertTeamMembership(userId, teamId);
  return team;
};

// Load a project and ensure the user is a member of its team.
export const getProjectOrThrow = async (userId, projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");
  await assertTeamMembership(userId, project.teamId);
  return project;
};

// Load an issue and ensure the user is a member of its team.
export const getIssueOrThrow = async (userId, issueId) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new ApiError(404, "Issue not found");
  await assertTeamMembership(userId, issue.teamId);
  return issue;
};
