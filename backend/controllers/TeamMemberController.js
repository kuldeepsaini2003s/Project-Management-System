import { asyncHandler } from "../utils/asyncHandler.js";
import * as teamMemberService from "../services/TeamMemberService.js";
import * as teamService from "../services/TeamService.js";

export const getMembers = asyncHandler(async (req, res) => {
  res.json(await teamMemberService.getTeamMembers(req.userId, req.params.id));
});

export const addMember = asyncHandler(async (req, res) => {
  res.status(201).json(
    await teamMemberService.addTeamMember(req.userId, req.params.id, req.body.userId, req.body.role)
  );
});

export const removeMember = asyncHandler(async (req, res) => {
  res.json(await teamMemberService.removeTeamMember(req.userId, req.params.id, req.params.userId));
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  res.json(
    await teamMemberService.updateTeamMemberRole(
      req.userId,
      req.params.id,
      req.params.userId,
      req.body.role
    )
  );
});

export const getTeamPublic = asyncHandler(async (req, res) => {
  res.json(await teamService.getTeamPublicInfo(req.params.id));
});

export const getMyRequest = asyncHandler(async (req, res) => {
  res.json(await teamMemberService.getMyJoinRequestStatus(req.userId, req.params.id));
});

export const requestToJoin = asyncHandler(async (req, res) => {
  res.status(201).json(await teamMemberService.createJoinRequest(req.userId, req.params.id));
});

export const getRequests = asyncHandler(async (req, res) => {
  res.json(await teamMemberService.getPendingJoinRequests(req.userId, req.params.id));
});

export const respondRequest = asyncHandler(async (req, res) => {
  res.json(
    await teamMemberService.respondToJoinRequest(req.userId, req.params.id, !!req.body.accept)
  );
});
