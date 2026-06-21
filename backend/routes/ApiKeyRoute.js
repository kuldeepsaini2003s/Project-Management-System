import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { create, list, revoke } from "../controllers/ApiKeyController.js";

const router = Router();
router.use(protect);

router.get("/",          list);
router.post("/",         create);
router.delete("/:keyId", revoke);

export default router;
