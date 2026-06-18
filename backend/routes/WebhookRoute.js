import { Router } from "express";
import { webhook } from "../controllers/GithubController.js";

// Public webhook route. Mounted with express.raw so signature verification
// can run against the exact bytes GitHub sent.
const router = Router();

router.post("/github", webhook);

export default router;
