import api from "../lib/api.js";

export const projectService = {
  listForWorkspace: (workspaceId) =>
    api.get(`/workspaces/${workspaceId}/projects`).then((r) => r.data),
  create: (workspaceId, payload) =>
    api.post(`/workspaces/${workspaceId}/projects`, payload).then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
};
