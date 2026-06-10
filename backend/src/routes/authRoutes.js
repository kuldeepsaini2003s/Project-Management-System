import { Router } from "express";
import { register, login, google, me } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", google);
router.get("/me", protect, me);

export default router;
