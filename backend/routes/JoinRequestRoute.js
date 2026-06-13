import { Router } from "express";
import { respondRequest } from "../controllers/TeamMemberController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

// Accept / reject a pending join request (team admins only).
router.post("/:id/respond", respondRequest);

export default router;
