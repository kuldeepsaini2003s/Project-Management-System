import { Router } from "express";
import { deleteLabel } from "../controllers/labelController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect);

router.delete("/:id", deleteLabel);

export default router;
