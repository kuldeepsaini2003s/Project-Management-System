import { Router } from "express";
import { register, login, google, googleOneTap, me, logout } from "../controllers/AuthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", google);
router.post("/google/one-tap", googleOneTap);
router.get("/me", protect, me);
router.post("/logout", protect, logout);

export default router;
