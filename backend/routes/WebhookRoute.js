import { Router } from "express";
import { webhook } from "../controllers/GithubController.js";

const router = Router();

router.post("/github", webhook);

export default router;
