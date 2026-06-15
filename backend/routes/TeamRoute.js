import { Router } from "express";
import {
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamProjects,
  createTeamProject,
  getTeamIssues,
  createTeamIssue,
} from "../controllers/TeamController.js";
import {
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  getTeamPublic,
  getMyRequest,
  requestToJoin,
  getRequests,
} from "../controllers/TeamMemberController.js";
import { createInvites } from "../controllers/TeamInviteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.get("/:id", getTeam);
router.patch("/:id", updateTeam);
router.delete("/:id", deleteTeam);

router.get("/:id/projects", getTeamProjects);
router.post("/:id/projects", createTeamProject);

router.get("/:id/issues", getTeamIssues);
router.post("/:id/issues", createTeamIssue);

// Members
router.get("/:id/members", getMembers);
router.post("/:id/members", addMember);
router.patch("/:id/members/:userId", updateMemberRole);
router.delete("/:id/members/:userId", removeMember);

// Invite by email
router.post("/:id/invites", createInvites);

// Join flow
router.get("/:id/public", getTeamPublic);
router.get("/:id/my-request", getMyRequest);
router.post("/:id/join", requestToJoin);
router.get("/:id/requests", getRequests);

export default router;
