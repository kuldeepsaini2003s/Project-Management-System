import { Router } from "express";
import { setup } from "../controllers/SlackController.js";

// Public Slack OAuth callback (no auth — identity is carried in the signed state).
const router = Router();

router.get("/setup", setup);

export default router;
