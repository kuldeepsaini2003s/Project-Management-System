import { Router } from "express";
import {
  getMyIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  createSubIssue,
  addComment,
} from "../controllers/issueController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.get("/mine", getMyIssues);
router.get("/:id", getIssue);
router.patch("/:id", updateIssue);
router.delete("/:id", deleteIssue);

router.post("/:id/sub-issues", createSubIssue);
router.post("/:id/comments", addComment);

export default router;
