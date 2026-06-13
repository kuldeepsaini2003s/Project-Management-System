import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

const client = new OAuth2Client(env.googleClientId);

/**
 * Validate a Google OAuth access token (from the frontend implicit flow)
 * and return a normalized profile.
 *
 * 1. getTokenInfo() asks Google to validate the token and tells us which
 *    client it was issued for — we reject tokens not minted for our app.
 * 2. The userinfo endpoint gives us the display name and avatar.
 */
export const verifyGoogleAccessToken = async (accessToken) => {
  if (!env.googleClientId) {
    throw new ApiError(500, "Google auth is not configured (GOOGLE_CLIENT_ID missing)");
  }

  let info;
  try {
    info = await client.getTokenInfo(accessToken);
  } catch {
    throw new ApiError(401, "Invalid Google token");
  }

  if (info.aud !== env.googleClientId) {
    throw new ApiError(401, "Google token was issued for a different app");
  }
  if (!info.email || info.email_verified === false) {
    throw new ApiError(401, "Google account email not verified");
  }

  let profile = {};
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) profile = await res.json();
  } catch {
    // Non-fatal: fall back to the token info we already have.
  }

  return {
    googleId: info.sub || profile.sub,
    email: info.email,
    name: profile.name || info.email.split("@")[0],
    avatarUrl: profile.picture || null,
  };
};
