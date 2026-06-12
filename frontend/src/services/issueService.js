import api from "../lib/api.js";

export const issueService = {
  get: (id) => api.get(`/issues/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/issues/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/issues/${id}`).then((r) => r.data),

  createSubIssue: (id, payload) =>
    api.post(`/issues/${id}/sub-issues`, payload).then((r) => r.data),
  addComment: (id, body) =>
    api.post(`/issues/${id}/comments`, { body }).then((r) => r.data),
  deleteComment: (commentId) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};
