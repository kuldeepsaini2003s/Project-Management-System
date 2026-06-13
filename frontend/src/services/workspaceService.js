import api from "../lib/api.js";

export const workspaceService = {
  list: () => api.get("/workspaces").then((r) => r.data),
  create: (payload) => api.post("/workspaces", payload).then((r) => r.data),
  get: (id) => api.get(`/workspaces/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/workspaces/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/workspaces/${id}`).then((r) => r.data),
  members: (id) => api.get(`/workspaces/${id}/members`).then((r) => r.data),
  projects: (id) => api.get(`/workspaces/${id}/projects`).then((r) => r.data),
};
