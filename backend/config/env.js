import dotenv from "dotenv";

dotenv.config();

const required = (key) => process.env[key];

const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: clientUrls[0],
  clientUrls,
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`,
  nodeEnv: process.env.NODE_ENV || "development",

  jwtSecret: required("JWT_SECRET") || "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  googleClientId: required("GOOGLE_CLIENT_ID"),

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  },

  appName: process.env.APP_NAME || "Linear",
  inviteTtlHours: Number(process.env.INVITE_TTL_HOURS) || 72,

  slack: {
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
    signingSecret: process.env.SLACK_SIGNING_SECRET || "",
    redirectUri:
      process.env.SLACK_REDIRECT_URI ||
      `${process.env.API_URL || "http://localhost:5000"}/api/slack/setup`,
  },

  notion: {
    clientId: process.env.NOTION_CLIENT_ID || "",
    clientSecret: process.env.NOTION_CLIENT_SECRET || "",
    redirectUri:
      process.env.NOTION_REDIRECT_URI ||
      `${process.env.API_URL || "http://localhost:5000"}/api/notion/setup`,
  },

  github: {
    appId: process.env.GITHUB_APP_ID,
    appSlug: process.env.GITHUB_APP_SLUG,
    clientId: process.env.GITHUB_APP_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET || "",
    callbackUri:
      process.env.GITHUB_APP_CALLBACK_URI ||
      `${process.env.API_URL || "http://localhost:5000"}/api/github/callback`,
    privateKey: (() => {
      const raw = process.env.GITHUB_APP_PRIVATE_KEY || "";
      if (!raw) return "";
      return raw.includes("BEGIN")
        ? raw.replace(/\\n/g, "\n")
        : Buffer.from(raw, "base64").toString("utf8");
    })(),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  },

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
};
