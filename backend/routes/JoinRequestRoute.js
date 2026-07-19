import { Router } from "express";
import { respondRequest } from "../controllers/TeamMemberController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.post("/:id/respond", respondRequest);

export default router;
