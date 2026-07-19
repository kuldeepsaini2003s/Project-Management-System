import { Router } from "express";
import {
  getUsers,
  getUser,
  updateUser,
  changeEmail,
  deleteUser,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "../controllers/UserController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.patch("/:id/email", changeEmail);
router.delete("/:id", deleteUser);

router.get("/:id/sessions", getSessions);
router.delete("/:id/sessions/:sessionId", revokeSession);
router.delete("/:id/sessions", revokeAllOtherSessions);

export default router;
