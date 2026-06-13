import { Router } from "express";
import {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getMembers,
  getWorkspaceTeams,
  createWorkspaceTeam,
  getWorkspaceProjects,
  getWorkspaceLabels,
  createWorkspaceLabel,
} from "../controllers/WorkspaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.get("/", getWorkspaces);
router.post("/", createWorkspace);
router.get("/:id", getWorkspace);
router.patch("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

router.get("/:id/members", getMembers);
router.get("/:id/teams", getWorkspaceTeams);
router.post("/:id/teams", createWorkspaceTeam);
router.get("/:id/projects", getWorkspaceProjects);
router.get("/:id/labels", getWorkspaceLabels);
router.post("/:id/labels", createWorkspaceLabel);

export default router;
