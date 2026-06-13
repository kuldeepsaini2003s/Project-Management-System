import { workspaceService } from "../../services/workspaceService.js";
import {
  setWorkspaces,
  addWorkspace,
  setWorkspaceMembers,
  setWorkspaceLoading,
} from "../workspaceSlice.js";
import { setCurrentWorkspace } from "../uiSlice.js";

export const fetchWorkspaces = () => async (dispatch) => {
  dispatch(setWorkspaceLoading(true));
  try {
    const data = await workspaceService.list();
    dispatch(setWorkspaces(data));
    return data;
  } finally {
    dispatch(setWorkspaceLoading(false));
  }
};

export const createWorkspace = (name) => async (dispatch) => {
  const workspace = await workspaceService.create({ name });
  dispatch(addWorkspace(workspace));
  dispatch(setCurrentWorkspace(workspace.id));
  return workspace;
};

export const fetchWorkspaceMembers = (workspaceId) => async (dispatch) => {
  const data = await workspaceService.members(workspaceId);
  dispatch(setWorkspaceMembers(data));
  return data;
};
