import { Router } from "express";
import { setup } from "../controllers/SlackController.js";

const router = Router();

router.get("/setup", setup);

export default router;
