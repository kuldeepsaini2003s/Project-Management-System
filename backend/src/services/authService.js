import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.js";
import { verifyGoogleAccessToken } from "../utils/googleClient.js";

const SALT_ROUNDS = 10;

// Strip sensitive fields before returning a user to the client.
const sanitize = ({ password, ...user }) => user;

const issue = (user) => ({
  user: sanitize(user),
  token: signToken({ sub: user.id }),
});

export const register = async ({ name, email, password }) => {
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

  return issue(user);
};

export const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  
  if (!valid) throw new ApiError(401, "Invalid email or password");

  return issue(user);
};

export const googleAuth = async ({ accessToken }) => {
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
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.googleId,
        avatarUrl: user.avatarUrl || profile.avatarUrl,
      },
    });
  }

  return issue(user);
};

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  return sanitize(user);
};
