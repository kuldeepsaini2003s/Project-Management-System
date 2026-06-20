import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

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

  // Check username uniqueness if provided
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

// ─── Sessions ─────────────────────────────────────────────────────────────────

// Resolve a human-readable city/region/country from an IP address.
// Uses ip-api.com (free, no key, 45 req/min). Falls back gracefully.
const resolveLocation = async (ip) => {
  try {
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return null; // local / private IP — skip
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

export const createSession = async ({ userId, sessionId, userAgent, ipAddress }) => {
  const location = await resolveLocation(ipAddress);
  return prisma.userSession.create({
    data: { userId, sessionId, userAgent, ipAddress, location },
  });
};

export const getUserSessions = async (userId) => {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
  });
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
