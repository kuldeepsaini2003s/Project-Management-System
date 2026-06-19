import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    console.warn(`[env] Missing ${key} — some features may not work.`);
  }
  return value;
};

// Allowed frontend origins. Supports a single CLIENT_URL or a comma-separated
// CLIENT_URLS list (e.g. localhost + the deployed Vercel URL). Used for CORS and
// for validating the GitHub return-redirect origin (prevents open redirects).
const clientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: clientUrls[0],
  clientUrls,
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

  // Slack App (api.slack.com/apps → OAuth & Permissions).
  // Redirect URL to register: {API_URL}/api/slack/setup
  // Bot Token Scope required: incoming-webhook
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
    signingSecret: process.env.SLACK_SIGNING_SECRET || "",
    // Must match exactly what's registered in Slack App → OAuth & Permissions → Redirect URLs.
    redirectUri:
      process.env.SLACK_REDIRECT_URI ||
      `${process.env.API_URL || "http://localhost:5000"}/api/slack/setup`,
  },

  // Notion Public Integration (notion.com/my-integrations → New integration → Public).
  // Redirect URL to register: {API_URL}/api/notion/setup
  notion: {
    clientId: process.env.NOTION_CLIENT_ID || "",
    clientSecret: process.env.NOTION_CLIENT_SECRET || "",
    redirectUri:
      process.env.NOTION_REDIRECT_URI ||
      `${process.env.API_URL || "http://localhost:5000"}/api/notion/setup`,
  },

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
