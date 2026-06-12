import api from "../lib/api.js";

export const issueService = {
  get: (id) => api.get(`/issues/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/issues/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/issues/${id}`).then((r) => r.data),
};
