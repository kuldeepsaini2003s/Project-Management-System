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
  //
  // IMPORTANT — required App settings, and why:
  // 1. Check "Request user authorization (OAuth) during installation" under
  //    "Identifying and authorizing users" in the App's settings. This
  //    REMOVES the single Setup URL field and replaces it with a "User
  //    authorization callback URL" section that accepts UP TO 10 URLs — add
  //    ONE ENTRY PER ENVIRONMENT you test against, e.g. both
  //    http://localhost:5000/api/github/callback (local dev) AND
  //    https://<your-deployed-backend>/api/github/callback (production).
  //    Each entry must match its environment's callbackUri byte-for-byte
  //    (protocol, no trailing slash, exact host).
  //    IMPORTANT: our code always sends redirect_uri explicitly (see
  //    oauthAuthorizeUrl in GithubService.js) so GitHub redirects back to
  //    THIS environment specifically. If redirect_uri were ever omitted,
  //    GitHub silently falls back to whichever callback URL is listed FIRST
  //    on the App's settings page regardless of which environment started
  //    the flow — which is exactly what caused local dev connects to
  //    transparently complete against production with zero local log output.
  // 2. We do NOT send users to GitHub's install-picker URL
  //    (github.com/apps/:slug/installations/new) as the first step anymore.
  //    That URL has a platform quirk, confirmed on GitHub's own community
  //    forum: when the app is already installed for the user, GitHub skips
  //    the picker entirely and redirects straight to its OWN management page
  //    (github.com/settings/installations/:id) with nothing for the user to
  //    click — and that specific "instant, zero-click" redirect fires NO
  //    callback at all, Setup URL or OAuth callback URL alike. This is a
  //    GitHub limitation, not a config bug — enabling OAuth-during-install
  //    does not fix this particular case, only the "one click to reauthorize"
  //    case.
  //    Instead, buildAuthorizeUrl() in GithubService.js sends users to the
  //    plain OAuth authorize screen (github.com/login/oauth/authorize) FIRST.
  //    That endpoint always completes with a real redirect back to our
  //    callback (installed or not), so we reliably land in
  //    handleOAuthCallback(), which calls GET /user/installations to check
  //    for an existing installation and only falls through to the
  //    install-picker URL when the user genuinely has none yet (a real
  //    first-time install, which has no "already installed" short-circuit to
  //    dead-end on).
  //
  // clientId/clientSecret are on the same App settings page as appId — every
  // GitHub App has them, separate from the private key used for server-to-
  // server installation tokens below. Both MUST be set as env vars on the
  // deployed backend (not just locally) — if either is missing, authorize()
  // now throws a clear 500 instead of silently falling back to the broken
  // install-picker path.
  github: {
    appId: process.env.GITHUB_APP_ID,
    appSlug: process.env.GITHUB_APP_SLUG, // the public install URL slug
    clientId: process.env.GITHUB_APP_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET || "",
    // Must match exactly what's registered as the App's "User authorization
    // callback URL" (only used/shown once OAuth-during-installation is on).
    callbackUri:
      process.env.GITHUB_APP_CALLBACK_URI ||
      `${process.env.API_URL || "http://localhost:5000"}/api/github/callback`,
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

  // Anthropic API key used to generate the GitPersona developer identity card.
  // GitPersona itself needs no separate GitHub app/callback — it reuses the
  // GitHub App installations above (per-team) for repo data.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
};
