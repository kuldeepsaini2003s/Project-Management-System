import { Router } from "express";
import {
  getConnection,
  authorize,
  setup,
  disconnect,
  startRun,
  getRunStatus,
  getOverview,
} from "../controllers/InboxZeroController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// OAuth callback hit by Google's redirect — authenticated via the signed state token.
router.get("/setup", setup);

router.get("/connection", protect, getConnection);
router.get("/authorize", protect, authorize);
router.delete("/connection", protect, disconnect);

router.post("/run", protect, startRun);
router.get("/run/status", protect, getRunStatus);
router.get("/overview", protect, getOverview);

export default router;
