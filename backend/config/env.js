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
  // Public URL of THIS backend (used to build the GitHub webhook URL).
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`,
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

  // GitHub App (Settings → Developer settings → GitHub Apps).
  github: {
    appId: process.env.GITHUB_APP_ID,
    appSlug: process.env.GITHUB_APP_SLUG, // the public install URL slug
    // PEM private key — supports raw (with \n escapes) or base64.
    privateKey: (() => {
      const raw = process.env.GITHUB_APP_PRIVATE_KEY || "";
      if (!raw) return "";
      return raw.includes("BEGIN")
        ? raw.replace(/\\n/g, "\n")
        : Buffer.from(raw, "base64").toString("utf8");
    })(),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  },
};
