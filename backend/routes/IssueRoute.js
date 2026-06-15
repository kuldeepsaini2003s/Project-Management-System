import { Router } from "express";
import {
  getMyIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  reorderIssues,
  createSubIssue,
  addComment,
  uploadIssueImages,
  deleteIssueImage,
} from "../controllers/IssueController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multerMiddleware.js";

const router = Router();
router.use(protect);

router.post("/reorder", reorderIssues);
router.get("/mine", getMyIssues);
router.get("/:id", getIssue);
router.patch("/:id", updateIssue);
router.delete("/:id", deleteIssue);

router.post("/:id/sub-issues", createSubIssue);
router.post("/:id/comments", addComment);

router.post("/:id/images", upload.array("images", 10), uploadIssueImages);
router.delete("/:id/images", deleteIssueImage);

export default router;
