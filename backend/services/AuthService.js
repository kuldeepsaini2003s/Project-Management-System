import bcrypt from "bcryptjs";
import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.js";
import { verifyGoogleAccessToken } from "../utils/googleClient.js";

const SALT_ROUNDS = 10;

// Strip sensitive fields before returning a user to the client.
const sanitizeUser = ({ password, ...user }) => user;

const buildAuthResponse = (user) => ({
  user: sanitizeUser(user),
  token: signToken({ sub: user.id }),
});

// Ensure the user has a workspace + proper team memberships. Runs on login,
// google auth, and /auth/me so data always loads (no refresh needed).
const ensureWorkspaceSetup = async (user) => {
  const count = await prisma.membership.count({ where: { userId: user.id } });
  if (count === 0) await createDefaultWorkspaceForUser(user);

  // Backfill legacy teams in the user's workspaces that have no members.
  const orphanTeams = await prisma.team.findMany({
    where: {
      workspace: { memberships: { some: { userId: user.id } } },
      memberships: { none: {} },
    },
    select: { id: true },
  });
  if (orphanTeams.length) {
    await prisma.teamMembership.createMany({
      data: orphanTeams.map((t) => ({ teamId: t.id, userId: user.id, role: "OWNER" })),
      skipDuplicates: true,
    });
  }
};

// Every new account gets a starter workspace (with a default team) they own.
const createDefaultWorkspaceForUser = (user) => {
  const first = user.name?.split(" ")[0] || "My";
  const key = (first.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "TEAM").padEnd(2, "X");
  return prisma.workspace.create({
    data: {
      name: `${first}'s`,
      memberships: { create: { userId: user.id, role: "OWNER" } },
      teams: {
        create: {
          name: `${first}'s Team`,
          key,
          color: "#5e6ad2",
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      },
    },
  });
};

export const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, provider: "EMAIL" },
  });
  await createDefaultWorkspaceForUser(user);

  return buildAuthResponse(user);
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) throw new ApiError(401, "Invalid email or password");

  await ensureWorkspaceSetup(user);
  return buildAuthResponse(user);
};

export const authenticateWithGoogle = async ({ accessToken }) => {
  if (!accessToken) throw new ApiError(400, "Google accessToken is required");

  const profile = await verifyGoogleAccessToken(accessToken);

  // Find by googleId, otherwise link/create by email.
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        googleId: profile.googleId,
        provider: "GOOGLE",
      },
    });
    await createDefaultWorkspaceForUser(user);
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.googleId,
        avatarUrl: user.avatarUrl || profile.avatarUrl,
      },
    });
  }

  await ensureWorkspaceSetup(user);
  return buildAuthResponse(user);
};

export const getCurrentUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  await ensureWorkspaceSetup(user);
  return sanitizeUser(user);
};
