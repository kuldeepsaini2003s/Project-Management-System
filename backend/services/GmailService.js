import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { resolveReturnOrigin, resolveReturnPath } from "../utils/origin.js";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/userinfo.email",
];

const assertConfigured = () => {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw new ApiError(500, "Gmail is not configured on the server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
  }
};

// ---------- OAuth (authorization-code flow, drafts-only scopes — never gmail.send) ----------

export const buildAuthorizeUrl = async (userId, { origin, returnPath } = {}) => {
  assertConfigured();

  const existing = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (existing?.refreshToken && !existing.active) {
    await prisma.gmailConnection.update({ where: { userId }, data: { active: true } });
    return { reconnected: true, googleEmail: existing.googleEmail };
  }
  if (existing?.refreshToken && existing.active) {
    return { reconnected: true, googleEmail: existing.googleEmail };
  }

  const state = signToken({
    gm: true,
    u: userId,
    c: resolveReturnOrigin(origin),
    p: resolveReturnPath(returnPath),
  });

  // If the user signed in with Google, we already know their email — passing it as
  // login_hint skips Google's account-picker step and jumps straight to the scope
  // consent screen. It cannot skip consent itself: gmail.readonly/gmail.compose are
  // restricted scopes, and Google always requires an explicit grant for those,
  // separate from whatever scopes the original sign-in used.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, provider: true } });

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.gmailRedirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  if (user?.provider === "GOOGLE" && user.email) params.set("login_hint", user.email);

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
};

export const handleOAuthCallback = async (query) => {
  let returnOrigin = env.clientUrl;
  const fail = (msg) => `${returnOrigin}/inbox-zero?gmail=error&message=${encodeURIComponent(msg)}`;

  const { code, state, error } = query;
  if (error) return fail(`Google returned an error: ${error}`);
  if (!code || !state) return fail("Missing authorization code or state — please try connecting again");

  let decoded;
  try {
    decoded = verifyToken(state);
  } catch {
    return fail("Invalid or expired authorization state");
  }
  const { gm, u: userId, c, p } = decoded || {};
  if (!gm || !userId) return fail("Invalid authorization state");
  returnOrigin = resolveReturnOrigin(c);

  let tokens;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: env.gmailRedirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokens = await res.json();
    if (!res.ok || !tokens.access_token) {
      return fail(tokens.error_description || tokens.error || "Google token exchange failed");
    }
  } catch {
    return fail("Could not reach Google to complete the connection");
  }

  if (!tokens.refresh_token) {
    return fail("Google did not return a refresh token — remove the app's access in your Google account and try again");
  }

  let googleEmail = "";
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (res.ok) googleEmail = (await res.json()).email || "";
  } catch {}
  if (!googleEmail) return fail("Could not read the connected Google account's email");

  await prisma.gmailConnection.upsert({
    where: { userId },
    update: { googleEmail, refreshToken: tokens.refresh_token, active: true },
    create: { userId, googleEmail, refreshToken: tokens.refresh_token, active: true },
  });

  return `${returnOrigin}${p || "/inbox-zero"}?gmail=connected`;
};

export const getConnection = async (userId) => {
  const conn = await prisma.gmailConnection.findUnique({ where: { userId } });
  const connected = !!conn?.refreshToken && conn.active !== false;
  return {
    connected,
    googleEmail: connected ? conn.googleEmail : null,
    lastSyncedAt: connected ? conn.lastSyncedAt : null,
  };
};

export const disconnect = async (userId) => {
  const conn = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!conn) return { ok: true };

  // Best-effort revoke so the grant doesn't linger in the user's Google account.
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(conn.refreshToken)}`, {
      method: "POST",
    });
  } catch {}

  await prisma.$transaction([
    prisma.inboxEmail.deleteMany({ where: { userId } }),
    prisma.inboxRun.deleteMany({ where: { userId } }),
    prisma.gmailConnection.delete({ where: { userId } }),
  ]);
  return { ok: true };
};

// ---------- Access tokens (short-lived, cached in memory) ----------

const tokenCache = new Map(); // userId -> { token, expiresAt }

export const getAccessToken = async (userId) => {
  const cached = tokenCache.get(userId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const conn = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!conn?.refreshToken || !conn.active) {
    throw new ApiError(400, "Connect your Gmail account first");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      refresh_token: conn.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    if (data.error === "invalid_grant") {
      await prisma.gmailConnection.update({ where: { userId }, data: { active: false } }).catch(() => {});
      throw new ApiError(401, "Gmail access was revoked — please reconnect your account");
    }
    throw new ApiError(502, "Could not refresh Gmail access — try again shortly");
  }

  tokenCache.set(userId, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  });
  return data.access_token;
};

// ---------- Gmail REST helpers ----------

const gmailFetch = async (token, path, init = {}) => {
  const res = await fetch(`${GMAIL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (res.status === 429) throw new ApiError(429, "Gmail API rate limit reached — try again in a minute");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(502, body?.error?.message || `Gmail API error (${res.status})`);
  }
  return res.json();
};

export const listRecentMessageIds = async (token, { days = 7, max = 200 } = {}) => {
  const ids = [];
  let pageToken = "";
  while (ids.length < max) {
    const params = new URLSearchParams({
      q: `in:inbox newer_than:${days}d -in:chats`,
      maxResults: String(Math.min(100, max - ids.length)),
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await gmailFetch(token, `/messages?${params}`);
    ids.push(...(data.messages || []).map((m) => m.id));
    pageToken = data.nextPageToken;
    if (!pageToken || !(data.messages || []).length) break;
  }
  return ids;
};

const b64Decode = (s) => Buffer.from((s || "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

const findPart = (payload, mime) => {
  if (!payload) return null;
  if (payload.mimeType === mime && payload.body?.data) return payload.body.data;
  for (const part of payload.parts || []) {
    const found = findPart(part, mime);
    if (found) return found;
  }
  return null;
};

const extractBody = (payload) => {
  let text = "";
  const plain = findPart(payload, "text/plain");
  if (plain) {
    text = b64Decode(plain);
  } else {
    const html = findPart(payload, "text/html");
    if (html) {
      text = b64Decode(html)
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    }
  }
  // Strip quoted history and signatures to cut noise/token cost.
  const lines = text.split("\n").filter((l) => !l.trim().startsWith(">"));
  const sigIdx = lines.findIndex((l) => l.trim() === "--");
  const cleaned = (sigIdx > 0 ? lines.slice(0, sigIdx) : lines).join("\n");
  return cleaned.replace(/\s+/g, " ").trim().slice(0, 1500);
};

const parseFrom = (raw) => {
  const m = (raw || "").match(/^(?:"?([^"<]*)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?$/);
  return { name: (m?.[1] || "").trim() || null, email: (m?.[2] || raw || "").toLowerCase() };
};

const header = (headers, name) =>
  headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

const BULK_SENDER_RE = /(no-?reply|newsletter|notifications?|mailer|marketing|updates|digest|info)@/i;

export const getMessage = async (token, id) => {
  const msg = await gmailFetch(token, `/messages/${id}?format=full`);
  const headers = msg.payload?.headers || [];
  const from = parseFrom(header(headers, "From"));

  const isBulk =
    !!header(headers, "List-Unsubscribe") ||
    /bulk|list/i.test(header(headers, "Precedence")) ||
    !!header(headers, "Auto-Submitted").replace(/^no$/i, "") ||
    BULK_SENDER_RE.test(from.email);

  return {
    gmailId: msg.id,
    threadId: msg.threadId,
    messageIdHeader: header(headers, "Message-ID"),
    references: header(headers, "References"),
    fromName: from.name,
    fromEmail: from.email,
    to: header(headers, "To"),
    subject: header(headers, "Subject") || "(no subject)",
    snippet: (msg.snippet || "").slice(0, 300),
    receivedAt: new Date(Number(msg.internalDate) || Date.now()),
    isBulk,
    body: extractBody(msg.payload),
    labelIds: msg.labelIds || [],
  };
};

export const getThreadContext = async (token, threadId, maxMessages = 4) => {
  const thread = await gmailFetch(token, `/threads/${threadId}?format=full`);
  const messages = (thread.messages || []).slice(-maxMessages);
  return messages.map((m) => {
    const headers = m.payload?.headers || [];
    return {
      from: header(headers, "From"),
      date: header(headers, "Date"),
      body: extractBody(m.payload),
    };
  });
};

// Creates a Gmail draft reply — never sends (the app never holds the gmail.send scope).
export const createDraftReply = async (token, { to, subject, body, threadId, messageIdHeader, references }) => {
  const replySubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;
  const headers = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    messageIdHeader ? `In-Reply-To: ${messageIdHeader}` : "",
    messageIdHeader ? `References: ${[references, messageIdHeader].filter(Boolean).join(" ")}` : "",
    'Content-Type: text/plain; charset="UTF-8"',
  ].filter(Boolean);

  const raw = Buffer.from(`${headers.join("\r\n")}\r\n\r\n${body}`)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const data = await gmailFetch(token, "/drafts", {
    method: "POST",
    body: JSON.stringify({ message: { raw, threadId } }),
  });
  return { draftId: data.id, messageId: data.message?.id || null };
};
