import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    console.warn(`[env] Missing ${key} — some features may not work.`);
  }
  return value;
};

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",

  jwtSecret: required("JWT_SECRET") || "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  googleClientId: required("GOOGLE_CLIENT_ID"),

  // SMTP (Nodemailer) for team invitation emails.
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for port 465
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  },

  appName: process.env.APP_NAME || "Linear",
  // How long an invite link stays valid (hours).
  inviteTtlHours: Number(process.env.INVITE_TTL_HOURS) || 72,
};
