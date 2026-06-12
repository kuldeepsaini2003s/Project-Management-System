import { Router } from "express";
import {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspaceController.js";
import {
  getProjects,
  createProject,
} from "../controllers/projectController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.use(protect);

router.get("/", getWorkspaces);
router.post("/", createWorkspace);
router.get("/:id", getWorkspace);
router.patch("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

// Workspace-scoped projects
router.get("/:workspaceId/projects", getProjects);
router.post("/:workspaceId/projects", createProject);

export default router;
