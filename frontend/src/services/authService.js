import api from "../lib/api.js";

export const authService = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  google: (accessToken) => api.post("/auth/google", { accessToken }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout").catch(() => {}), // best-effort — clear local state regardless
};
