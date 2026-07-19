import axios from "axios";
import { BACKEND_URL, TOKEN_KEY } from "../utils/constants.js";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    // If baseURL is misconfigured (e.g. VITE_API_URL missing), the dev server's
    // SPA fallback returns index.html with a 200. Fail loudly instead of letting
    // an HTML string flow into the store as if it were JSON.
    const ct = response.headers?.["content-type"] || "";
    if (typeof response.data === "string" && ct.includes("text/html")) {
      return Promise.reject(
        new Error(
          `Expected JSON from ${response.config?.url} but received HTML. Check VITE_API_URL.`
        )
      );
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
