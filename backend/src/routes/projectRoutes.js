import { Router } from "express";
import {
  getProject,
  updateProject,
  deleteProject,
  getProjectIssues,
} from "../controllers/projectController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.get("/:id/issues", getProjectIssues);

export default router;
