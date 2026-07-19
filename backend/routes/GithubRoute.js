import { Router } from "express";
import { setup, callback } from "../controllers/GithubController.js";

// Public GitHub App setup/callback (no auth — identity is carried in the signed state).
const router = Router();

router.get("/setup", setup);
router.get("/callback", callback);

export default router;
