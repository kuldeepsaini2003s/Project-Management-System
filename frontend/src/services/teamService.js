import api from "../lib/api.js";

export const teamService = {
  listForWorkspace: (workspaceId) =>
    api.get(`/workspaces/${workspaceId}/teams`).then((r) => r.data),
  create: (workspaceId, payload) =>
    api.post(`/workspaces/${workspaceId}/teams`, payload).then((r) => r.data),
  get: (id) => api.get(`/teams/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/teams/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/teams/${id}`).then((r) => r.data),

  listProjects: (id) => api.get(`/teams/${id}/projects`).then((r) => r.data),
  createProject: (id, payload) =>
    api.post(`/teams/${id}/projects`, payload).then((r) => r.data),

  listIssues: (id) => api.get(`/teams/${id}/issues`).then((r) => r.data),
  createIssue: (id, payload) =>
    api.post(`/teams/${id}/issues`, payload).then((r) => r.data),

  listLabels: (id) => api.get(`/teams/${id}/labels`).then((r) => r.data),
  createLabel: (id, payload) =>
    api.post(`/teams/${id}/labels`, payload).then((r) => r.data),

  // Members
  listMembers: (id) => api.get(`/teams/${id}/members`).then((r) => r.data),
  addMember: (id, userId, role) =>
    api.post(`/teams/${id}/members`, { userId, role }).then((r) => r.data),
  updateMemberRole: (id, userId, role) =>
    api.patch(`/teams/${id}/members/${userId}`, { role }).then((r) => r.data),
  removeMember: (id, userId) =>
    api.delete(`/teams/${id}/members/${userId}`).then((r) => r.data),

  // Join flow
  getPublic: (id) => api.get(`/teams/${id}/public`).then((r) => r.data),
  myRequest: (id) => api.get(`/teams/${id}/my-request`).then((r) => r.data),
  requestJoin: (id) => api.post(`/teams/${id}/join`).then((r) => r.data),
  listRequests: (id) => api.get(`/teams/${id}/requests`).then((r) => r.data),
  respondRequest: (requestId, accept) =>
    api.post(`/join-requests/${requestId}/respond`, { accept }).then((r) => r.data),
};

