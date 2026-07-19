import { Router } from "express";
import { setup } from "../controllers/NotionController.js";

const router = Router();

router.get("/setup", setup);

export default router;
