import { Router } from "express";
import { getInvite, acceptInvite } from "../controllers/TeamInviteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:token", getInvite);

router.post("/:token/accept", protect, acceptInvite);

export default router;
