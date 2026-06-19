import { Router } from "express";
import { setup } from "../controllers/NotionController.js";

// Public Notion OAuth callback (no auth — identity is carried in the signed state).
const router = Router();

router.get("/setup", setup);

export default router;
