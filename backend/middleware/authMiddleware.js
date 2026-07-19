import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";
import prisma from "../db/index.js";

// Update lastSeenAt at most once every few minutes (cheap conditional update).
const SEEN_THROTTLE_MS = 3 * 60 * 1000;
const touchLastSeen = (userId) => {
  const cutoff = new Date(Date.now() - SEEN_THROTTLE_MS);
  prisma.user
    .updateMany({
      where: { id: userId, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});
};

const touchSession = (sessionId) => {
  if (!sessionId) return;
  prisma.userSession
    .updateMany({
      where: {
        sessionId,
        lastActiveAt: { lt: new Date(Date.now() - 60_000) },
      },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});
};

/**
 * Require a valid Bearer JWT. Attaches req.userId and req.sessionId on success.
 *
 * IMPORTANT: also checks that req.sessionId still has a live row in
 * UserSession. Previously this only verified the JWT's signature/expiry, so
 * "Revoke" on the Security page (and sign-out, which now also deletes the
 * row — see AuthController.logout) only removed the entry from the LIST —
 * the token itself kept working for its full remaining life on whatever
 * device actually held it. This check is what makes Revoke an actual,
 * enforced logout instead of a cosmetic one.
 */
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  req.userId = decoded.sub;
  req.sessionId = decoded.sid || null;

  if (req.sessionId) {
    try {
      const session = await prisma.userSession.findUnique({
        where: { sessionId: req.sessionId },
        select: { sessionId: true },
      });
      if (!session) {
        return next(new ApiError(401, "This session has been signed out — please sign in again"));
      }
    } catch (e) {
      // Transient DB error checking the session — don't lock every logged-in
      // user out over a hiccup; fail open on THIS check only (the JWT itself
      // was already verified above).
      console.error("[auth] session lookup failed, allowing request through:", e?.message);
    }
  }

  touchLastSeen(req.userId);
  touchSession(req.sessionId);
  next();
};
