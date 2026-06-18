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

/**
 * Require a valid Bearer JWT. Attaches req.userId on success.
 */
export const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.sub;
    touchLastSeen(req.userId); // fire-and-forget
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};
