// Centralised app configuration, driven by Vite env vars.
// Matches the e-commerce app convention of keeping API/config constants in utils.

export const BACKEND_URL = import.meta.env.VITE_API_URL || "/api";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// localStorage key for the JWT.
export const TOKEN_KEY = "linear-token";
