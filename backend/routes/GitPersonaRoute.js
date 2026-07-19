import { Router } from "express";
import {
  getCard,
  generateCard,
  getGenerationStatus,
  setVisibility,
  getPublicCard,
} from "../controllers/GitPersonaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/public/:login", getPublicCard);

router.get("/card", protect, getCard);
router.post("/card/generate", protect, generateCard);
router.get("/card/status", protect, getGenerationStatus);
router.patch("/card/visibility", protect, setVisibility);

export default router;
