import { Router } from "express";
import { getIssue, updateIssue, deleteIssue } from "../controllers/issueController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.get("/:id", getIssue);
router.patch("/:id", updateIssue);
router.delete("/:id", deleteIssue);

export default router;
