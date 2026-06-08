import api from "./api.js";
import { ENDPOINTS } from "../constants/index.js";

export const userService = {
  getAll: () => api.get(ENDPOINTS.USERS).then((r) => r.data),
  getById: (id) => api.get(`${ENDPOINTS.USERS}/${id}`).then((r) => r.data),
  create: (payload) => api.post(ENDPOINTS.USERS, payload).then((r) => r.data),
  update: (id, payload) =>
    api.put(`${ENDPOINTS.USERS}/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`${ENDPOINTS.USERS}/${id}`).then((r) => r.data),
};
