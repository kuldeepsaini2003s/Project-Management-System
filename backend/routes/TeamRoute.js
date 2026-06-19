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
import { getConnection, authorize, manage, listRepos, disconnect } from "../controllers/GithubController.js";
import {
  getConnection as getSlack,
  connect as connectSlack,
  disconnect as disconnectSlack,
} from "../controllers/SlackController.js";
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

// GitHub integration (OAuth)
router.get("/:id/github", getConnection);
router.get("/:id/github/authorize", authorize);
router.get("/:id/github/manage", manage);
router.get("/:id/github/repos", listRepos);
router.delete("/:id/github", disconnect);

// Slack integration (incoming webhook)
router.get("/:id/slack", getSlack);
router.post("/:id/slack", connectSlack);
router.delete("/:id/slack", disconnectSlack);

// Join flow
router.get("/:id/public", getTeamPublic);
router.get("/:id/my-request", getMyRequest);
router.post("/:id/join", requestToJoin);
router.get("/:id/requests", getRequests);

export default router;
