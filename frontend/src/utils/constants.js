// Base URL for all API requests. In dev this is proxied to the backend by
// vite.config.js; in production set VITE_API_URL to the deployed API origin.
export const BACKEND_URL = import.meta.env.VITE_API_URL || "/api";

// Key under which the auth JWT is stored in localStorage.
export const TOKEN_KEY = "linear-token";

// Key under which the selected workspace id is persisted.
export const CURRENT_WORKSPACE_KEY = "linear-current-workspace";

// Key under which the theme preference is persisted.
export const THEME_KEY = "linear-theme";
