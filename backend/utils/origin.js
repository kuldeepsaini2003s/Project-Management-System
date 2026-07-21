import { env } from "../config/env.js";

/**
 * Extract the browser origin from the incoming request.
 * Prefers the Origin header (set on fetch/XHR), falls back to Referer.
 */
export const reqOrigin = (req) => {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {}
  }
  return undefined;
};

/**
 * Validate a client-supplied origin against the CLIENT_URL allowlist.
 * Never trust the Origin/Referer header blindly — an attacker could spoof it
 * and turn the OAuth callback into an open redirect. Unknown origins fall
 * back to the primary client URL (first entry in CLIENT_URL).
 */
export const resolveReturnOrigin = (origin) => {
  const clean = (origin || "").replace(/\/$/, "");
  return env.clientUrls.includes(clean) ? clean : env.clientUrl;
};

const SAFE_PATH = /^\/[a-zA-Z0-9\-_/]*$/;

/** Only allow simple same-site paths as post-OAuth return paths. */
export const resolveReturnPath = (path) =>
  typeof path === "string" && path.length < 200 && SAFE_PATH.test(path)
    ? path
    : null;
