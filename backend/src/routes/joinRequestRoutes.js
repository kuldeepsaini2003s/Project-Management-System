import { Router } from "express";
import { respondRequest } from "../controllers/teamMemberController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

// Accept / reject a pending join request (team admins only).
router.post("/:id/respond", respondRequest);

export default router;
