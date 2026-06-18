import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { connectSocket, disconnectSocket } from "../lib/socket.js";
import { notificationService } from "../services/notificationService.js";
import {
  setNotifications,
  setUnread,
  addNotification,
  resetNotifications,
} from "../redux/notificationSlice.js";

// Loads notifications + opens the realtime socket while the user is signed in.
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      dispatch(resetNotifications());
      return;
    }

    let active = true;
    notificationService
      .list()
      .then((d) => active && dispatch(setNotifications(d)))
      .catch(() => {});
    notificationService
      .unreadCount()
      .then((d) => active && dispatch(setUnread(d.unread)))
      .catch(() => {});

    const socket = connectSocket();
    if (socket) {
      socket.on("notification:new", (n) => dispatch(addNotification(n)));
      socket.on("notification:count", ({ unread }) => dispatch(setUnread(unread)));
    }

    return () => {
      active = false;
      if (socket) {
        socket.off("notification:new");
        socket.off("notification:count");
      }
    };
  }, [isAuthenticated, dispatch]);

  return children;
}
