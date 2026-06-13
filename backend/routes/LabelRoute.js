import { Router } from "express";
import { deleteLabel } from "../controllers/LabelController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.delete("/:id", deleteLabel);

export default router;
