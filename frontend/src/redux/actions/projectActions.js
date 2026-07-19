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
  reorderBoard,
  setCurrentProject,
  setProjectLoading,
} from "../projectSlice.js";

const PROJECT_SETTERS = {
  teamProjects: setTeamProjects,
  workspaceProjects: setWorkspaceProjects,
};

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

export const reorderProjects =
  (board, status, orderedIds) => async (dispatch, getState) => {
    const snapshot = getState().project[board];
    dispatch(reorderBoard({ board, status, orderedIds }));
    try {
      await projectService.reorder(status, orderedIds);
    } catch (err) {
      const restore = PROJECT_SETTERS[board];
      if (restore && snapshot) dispatch(restore(snapshot));
      throw err;
    }
  };

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
