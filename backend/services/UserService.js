import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  username: true,
  avatarUrl: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
};

export const getAllUsers = () =>
  prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: PUBLIC_USER_FIELDS });

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_FIELDS });
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateUser = async (id, data) => {
  await getUserById(id);
  const { name, avatarUrl, username } = data;

  if (username !== undefined && username !== null && username.trim()) {
    const conflict = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (conflict && conflict.id !== id) {
      throw new ApiError(409, "This username is already taken");
    }
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(username !== undefined && { username: username?.trim() || null }),
    },
    select: PUBLIC_USER_FIELDS,
  });
};

export const changeEmail = async (id, { email }) => {
  if (!email?.trim()) throw new ApiError(400, "Email is required");
  const normalized = email.trim().toLowerCase();

  const conflict = await prisma.user.findUnique({ where: { email: normalized } });
  if (conflict && conflict.id !== id) {
    throw new ApiError(409, "An account with this email already exists");
  }

  return prisma.user.update({
    where: { id },
    data: { email: normalized },
    select: PUBLIC_USER_FIELDS,
  });
};

export const deleteUser = async (id) => {
  await getUserById(id);
  await prisma.user.delete({ where: { id } });
};

const resolveLocation = async (ip) => {
  try {
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return "Local network";
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionCode,countryCode`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success") return null;
    return [data.city, data.regionCode, data.countryCode].filter(Boolean).join(", ");
  } catch {
    return null;
  }
};

const parseExpiryMs = (input) => {
  const match = /^(\d+)\s*(d|h|m|s)$/.exec(String(input || "").trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unitMs = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1000 }[match[2]];
  return n * unitMs;
};

export const createSession = async ({ userId, sessionId, userAgent, ipAddress }) => {
  const expiresAt = new Date(Date.now() + parseExpiryMs(env.jwtExpiresIn));

  const existing = userAgent ? await prisma.userSession.findFirst({ where: { userId, userAgent } }) : null;

  const row = existing
    ? await prisma.userSession.update({
        where: { sessionId: existing.sessionId },
        data: { ipAddress, expiresAt, lastActiveAt: new Date() },
      })
    : await prisma.userSession.create({
        data: { userId, sessionId, userAgent, ipAddress, expiresAt },
      });

  resolveLocation(ipAddress).then((location) => {
    if (location) {
      prisma.userSession.update({ where: { sessionId: row.sessionId }, data: { location } }).catch(() => {});
    }
  });

  return row;
};

export const getUserSessions = async (userId) => {
  const now = new Date();
  const sessions = await prisma.userSession.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { lastActiveAt: "desc" },
  });
  prisma.userSession
    .deleteMany({ where: { userId, OR: [{ expiresAt: { lte: now } }, { expiresAt: null }] } })
    .catch(() => {});
  return sessions;
};

export const touchSession = async (sessionId) => {
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

export const revokeSession = async (userId, sessionId) => {
  const session = await prisma.userSession.findUnique({ where: { sessionId } });
  if (!session || session.userId !== userId) {
    throw new ApiError(404, "Session not found");
  }
  await prisma.userSession.delete({ where: { sessionId } });
};

export const revokeAllOtherSessions = async (userId, exceptSessionId) => {
  await prisma.userSession.deleteMany({
    where: { userId, NOT: { sessionId: exceptSessionId } },
  });
};
