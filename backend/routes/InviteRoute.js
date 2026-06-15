import { Router } from "express";
import { getInvite, acceptInvite } from "../controllers/TeamInviteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public: anyone with the link can view invite details (before logging in).
router.get("/:token", getInvite);

// Authenticated: accept the invite and join the team.
router.post("/:token/accept", protect, acceptInvite);

export default router;
