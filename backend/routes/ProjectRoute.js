import { Router } from "express";
import {
  getProject,
  updateProject,
  deleteProject,
  reorderProjects,
  getProjectIssues,
} from "../controllers/ProjectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.post("/reorder", reorderProjects);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.get("/:id/issues", getProjectIssues);

export default router;
