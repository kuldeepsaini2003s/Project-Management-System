import { teamService } from "../../services/teamService.js";
import {
  setTeams,
  addTeam,
  setCurrentTeam,
  setTeamMembers,
  setTeamRequests,
  setTeamLoading,
} from "../teamSlice.js";

export const fetchTeams = (workspaceId) => async (dispatch) => {
  if (!workspaceId) return [];
  dispatch(setTeamLoading(true));
  try {
    const data = await teamService.listForWorkspace(workspaceId);
    dispatch(setTeams(data));
    return data;
  } catch (err) {
    dispatch(setTeams([]));
    console.error("Failed to fetch teams:", err);
    return [];
  } finally {
    dispatch(setTeamLoading(false));
  }
};

export const createTeam = (workspaceId, payload) => async (dispatch) => {
  const team = await teamService.create(workspaceId, payload);
  dispatch(addTeam(team));
  return team;
};

export const fetchTeam = (id) => async (dispatch) => {
  const team = await teamService.get(id);
  dispatch(setCurrentTeam(team));
  return team;
};

export const updateTeam = (id, payload) => async (dispatch) => {
  const team = await teamService.update(id, payload);
  dispatch(setCurrentTeam(team));
  return team;
};

export const fetchTeamMembers = (id) => async (dispatch) => {
  const data = await teamService.listMembers(id);
  dispatch(setTeamMembers(data));
  return data;
};

export const addTeamMember = (id, userId) => async (dispatch) => {
  const members = await teamService.addMember(id, userId);
  dispatch(setTeamMembers(members));
  return members;
};

export const removeTeamMember = (id, userId) => async (dispatch) => {
  const members = await teamService.removeMember(id, userId);
  dispatch(setTeamMembers(members));
  return members;
};

export const fetchTeamRequests = (id) => async (dispatch) => {
  const data = await teamService.listRequests(id);
  dispatch(setTeamRequests(data));
  return data;
};

export const respondToJoinRequest = (requestId, accept, teamId) => async (dispatch) => {
  await teamService.respondRequest(requestId, accept);
  const requests = await teamService.listRequests(teamId);
  dispatch(setTeamRequests(requests));
  if (accept) {
    const members = await teamService.listMembers(teamId);
    dispatch(setTeamMembers(members));
  }
};
