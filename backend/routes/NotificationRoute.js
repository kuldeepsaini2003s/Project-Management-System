import { Router } from "express";
import {
  listNotifications,
  unreadCount,
  readOne,
  readAll,
} from "../controllers/NotificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.post("/read-all", readAll);
router.post("/:id/read", readOne);

export default router;
