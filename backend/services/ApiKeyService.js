import crypto from "crypto";
import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const PREFIX = "lnr_";

const generate = () => {
  const raw = PREFIX + crypto.randomBytes(32).toString("base64url");
  return { key: raw, hint: raw.slice(-6) };
};

export const createApiKey = async (userId, name) => {
  if (!name?.trim()) throw new ApiError(400, "API key name is required");
  const { key, hint } = generate();
  const record = await prisma.apiKey.create({
    data: { name: name.trim(), key, hint, userId },
    select: { id: true, name: true, hint: true, createdAt: true },
  });
  return { ...record, key };
};

export const listApiKeys = async (userId) => {
  return prisma.apiKey.findMany({
    where: { userId, revoked: false },
    select: { id: true, name: true, hint: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
};

export const revokeApiKey = async (userId, keyId) => {
  const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!key || key.userId !== userId) throw new ApiError(404, "API key not found");
  await prisma.apiKey.update({ where: { id: keyId }, data: { revoked: true } });
  return { ok: true };
};

export const validateApiKey = async (rawKey) => {
  if (!rawKey?.startsWith(PREFIX)) throw new ApiError(401, "Invalid API key");
  const record = await prisma.apiKey.findUnique({ where: { key: rawKey } });
  if (!record || record.revoked) throw new ApiError(401, "Invalid or revoked API key");
  prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return record.userId;
};
