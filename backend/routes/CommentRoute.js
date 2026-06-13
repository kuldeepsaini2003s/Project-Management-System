import { Router } from "express";
import { deleteComment } from "../controllers/IssueController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.delete("/:id", deleteComment);

export default router;
