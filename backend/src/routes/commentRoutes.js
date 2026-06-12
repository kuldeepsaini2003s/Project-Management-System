import { Router } from "express";
import { deleteComment } from "../controllers/issueController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.delete("/:id", deleteComment);

export default router;
