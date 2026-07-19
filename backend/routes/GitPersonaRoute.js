import { Router } from "express";
import { getCard, generateCard, setVisibility, getPublicCard } from "../controllers/GitPersonaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public — the shareable read-only card.
router.get("/public/:login", getPublicCard);

// Personal (authenticated). GitHub connect/disconnect lives entirely under
// /api/teams/:id/github (Settings → Connected accounts) — GitPersona only
// reads that same connection, it doesn't duplicate it.
router.get("/card", protect, getCard);
router.post("/card/generate", protect, generateCard);
router.patch("/card/visibility", protect, setVisibility);

export default router;
