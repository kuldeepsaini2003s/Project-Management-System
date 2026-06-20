import { Router } from "express";
import { updateLabel, deleteLabel } from "../controllers/LabelController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.patch("/:id", updateLabel);
router.delete("/:id", deleteLabel);

export default router;
