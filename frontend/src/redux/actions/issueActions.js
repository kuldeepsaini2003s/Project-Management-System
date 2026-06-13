import { teamService } from "../../services/teamService.js";
import { projectService } from "../../services/projectService.js";
import { issueService } from "../../services/issueService.js";
import {
  setTeamIssues,
  setProjectIssues,
  setMyIssues,
  addIssue,
  patchIssueStatus,
  setCurrentIssue,
  setIssueLoading,
} from "../issueSlice.js";

export const fetchTeamIssues = (teamId) => async (dispatch) => {
  dispatch(setIssueLoading(true));
  try {
    const data = await teamService.listIssues(teamId);
    dispatch(setTeamIssues(data));
    return data;
  } finally {
    dispatch(setIssueLoading(false));
  }
};

export const fetchProjectIssues = (projectId) => async (dispatch) => {
  dispatch(setIssueLoading(true));
  try {
    const { issues } = await projectService.listIssues(projectId);
    dispatch(setProjectIssues(issues));
    return issues;
  } finally {
    dispatch(setIssueLoading(false));
  }
};

export const fetchMyIssues = () => async (dispatch) => {
  dispatch(setIssueLoading(true));
  try {
    const data = await issueService.mine();
    dispatch(setMyIssues(data));
    return data;
  } finally {
    dispatch(setIssueLoading(false));
  }
};

export const createIssue = (teamId, payload) => async (dispatch) => {
  const issue = await teamService.createIssue(teamId, payload);
  dispatch(addIssue(issue));
  return issue;
};

export const fetchIssue = (id) => async (dispatch) => {
  const issue = await issueService.get(id);
  dispatch(setCurrentIssue(issue));
  return issue;
};

export const updateIssue = (id, payload) => async (dispatch) => {
  const issue = await issueService.update(id, payload);
  dispatch(setCurrentIssue(issue));
  return issue;
};

// Optimistic board drag — move the card now, persist in the background, roll back on failure.
export const moveIssueStatus = (id, status) => async (dispatch, getState) => {
  const { teamIssues, projectIssues, myIssues } = getState().issue;
  const previousStatus = [...teamIssues, ...projectIssues, ...myIssues].find((i) => i.id === id)?.status;

  dispatch(patchIssueStatus({ id, status }));
  try {
    await issueService.update(id, { status });
  } catch (err) {
    if (previousStatus) dispatch(patchIssueStatus({ id, status: previousStatus }));
    throw err;
  }
};

export const deleteIssue = (id) => async () => {
  await issueService.remove(id);
};

export const createSubIssue = (parentId, payload) => async (dispatch) => {
  await issueService.createSubIssue(parentId, payload);
  const issue = await issueService.get(parentId);
  dispatch(setCurrentIssue(issue));
  return issue;
};

export const addComment = (issueId, body) => async (dispatch) => {
  await issueService.addComment(issueId, body);
  const issue = await issueService.get(issueId);
  dispatch(setCurrentIssue(issue));
  return issue;
};

export const deleteComment = (commentId, issueId) => async (dispatch) => {
  await issueService.deleteComment(commentId);
  const issue = await issueService.get(issueId);
  dispatch(setCurrentIssue(issue));
  return issue;
};
