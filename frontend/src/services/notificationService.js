import api from "../lib/api.js";

export const notificationService = {
  list: () => api.get("/notifications").then((r) => r.data),
  unreadCount: () => api.get("/notifications/unread-count").then((r) => r.data),
  read: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.post("/notifications/read-all").then((r) => r.data),
};
