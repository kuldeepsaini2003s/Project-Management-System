import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";
import prisma from "../db/index.js";

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
      console.error("[auth] session lookup failed, allowing request through:", e?.message);
    }
  }

  touchLastSeen(req.userId);
  touchSession(req.sessionId);
  next();
};
