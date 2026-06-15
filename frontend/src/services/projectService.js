import api from "../lib/api.js";

export const projectService = {
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
  reorder: (status, orderedIds) =>
    api.post("/projects/reorder", { status, orderedIds }).then((r) => r.data),
  listIssues: (id) => api.get(`/projects/${id}/issues`).then((r) => r.data),
};
