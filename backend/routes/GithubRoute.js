import { Router } from "express";
import { setup, callback } from "../controllers/GithubController.js";

const router = Router();

router.get("/setup", setup);
router.get("/callback", callback);

export default router;
