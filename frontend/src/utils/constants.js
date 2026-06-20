export const BACKEND_URL = import.meta.env.VITE_API_URL;

// Socket.IO server origin (root, not /api). In dev the backend runs on :5000. 
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL;

// Key under which the auth JWT is stored in localStorage.
export const TOKEN_KEY = "algofolks-token";

// Key under which the selected workspace id is persisted.
export const CURRENT_WORKSPACE_KEY = "algofolks-current-workspace";

// Key under which the theme preference is persisted.
export const THEME_KEY = "algofolks-theme";

// Recent search history (array of query strings).
export const SEARCH_HISTORY_KEY = "algofolks-search-history";

// Sidebar visibility preferences.
export const SIDEBAR_PREFS_KEY = "algofolks-sidebar-prefs";
