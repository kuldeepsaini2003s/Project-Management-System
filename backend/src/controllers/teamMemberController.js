import { asyncHandler } from "../utils/asyncHandler.js";
import * as svc from "../services/teamMemberService.js";
import * as teamService from "../services/teamService.js";

export const getMembers = asyncHandler(async (req, res) => {
  res.json(await svc.listMembers(req.userId, req.params.id));
});

export const addMember = asyncHandler(async (req, res) => {
  res.status(201).json(
    await svc.addMember(req.userId, req.params.id, req.body.userId, req.body.role)
  );
});

export const removeMember = asyncHandler(async (req, res) => {
  res.json(await svc.removeMember(req.userId, req.params.id, req.params.userId));
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  res.json(await svc.updateRole(req.userId, req.params.id, req.params.userId, req.body.role));
});

export const getTeamPublic = asyncHandler(async (req, res) => {
  res.json(await teamService.getPublic(req.params.id));
});

export const getMyRequest = asyncHandler(async (req, res) => {
  res.json(await svc.myRequestStatus(req.userId, req.params.id));
});

export const requestToJoin = asyncHandler(async (req, res) => {
  res.status(201).json(await svc.requestToJoin(req.userId, req.params.id));
});

export const getRequests = asyncHandler(async (req, res) => {
  res.json(await svc.listRequests(req.userId, req.params.id));
});

export const respondRequest = asyncHandler(async (req, res) => {
  res.json(await svc.respondToRequest(req.userId, req.params.id, !!req.body.accept));
});
