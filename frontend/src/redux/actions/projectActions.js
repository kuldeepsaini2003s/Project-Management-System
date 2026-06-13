import { teamService } from "../../services/teamService.js";
import { projectService } from "../../services/projectService.js";
import { workspaceService } from "../../services/workspaceService.js";
import {
  setTeamProjects,
  setWorkspaceProjects,
  addProject,
  updateProjectInStore,
  removeProjectFromStore,
  patchProjectStatus,
  setCurrentProject,
  setProjectLoading,
} from "../projectSlice.js";

export const fetchTeamProjects = (teamId) => async (dispatch) => {
  dispatch(setProjectLoading(true));
  try {
    const data = await teamService.listProjects(teamId);
    dispatch(setTeamProjects(data));
    return data;
  } finally {
    dispatch(setProjectLoading(false));
  }
};

export const fetchWorkspaceProjects = (workspaceId) => async (dispatch) => {
  dispatch(setProjectLoading(true));
  try {
    const data = await workspaceService.projects(workspaceId);
    dispatch(setWorkspaceProjects(data));
    return data;
  } finally {
    dispatch(setProjectLoading(false));
  }
};

export const createProject = (teamId, payload) => async (dispatch) => {
  const project = await teamService.createProject(teamId, payload);
  dispatch(addProject(project));
  return project;
};

export const fetchProject = (id) => async (dispatch) => {
  const project = await projectService.get(id);
  dispatch(setCurrentProject(project));
  return project;
};

export const updateProject = (id, payload) => async (dispatch) => {
  const project = await projectService.update(id, payload);
  dispatch(updateProjectInStore(project));
  return project;
};

export const deleteProject = (id) => async (dispatch) => {
  await projectService.remove(id);
  dispatch(removeProjectFromStore(id));
};

// Optimistic drag: move the card now, persist in the background, roll back on failure.
export const moveProjectStatus = (id, status) => async (dispatch, getState) => {
  const { teamProjects, workspaceProjects } = getState().project;
  const previousStatus = [...teamProjects, ...workspaceProjects].find((p) => p.id === id)?.status;

  dispatch(patchProjectStatus({ id, status }));
  try {
    await projectService.update(id, { status });
  } catch (err) {
    if (previousStatus) dispatch(patchProjectStatus({ id, status: previousStatus }));
    throw err;
  }
};
