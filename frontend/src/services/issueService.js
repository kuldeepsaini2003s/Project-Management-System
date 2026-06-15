import api from "../lib/api.js";

export const issueService = {
  mine: () => api.get("/issues/mine").then((r) => r.data),
  get: (id) => api.get(`/issues/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/issues/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/issues/${id}`).then((r) => r.data),
  reorder: (status, orderedIds) =>
    api.post("/issues/reorder", { status, orderedIds }).then((r) => r.data),

  uploadImages: (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return api
      .post(`/issues/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  removeImage: (id, url) =>
    api.delete(`/issues/${id}/images`, { data: { url } }).then((r) => r.data),

  createSubIssue: (id, payload) =>
    api.post(`/issues/${id}/sub-issues`, payload).then((r) => r.data),
  addComment: (id, body) =>
    api.post(`/issues/${id}/comments`, { body }).then((r) => r.data),
  deleteComment: (commentId) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};
