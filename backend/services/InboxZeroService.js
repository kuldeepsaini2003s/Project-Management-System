import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import * as gmail from "./GmailService.js";
import { getBestResponse } from "./AiService.js";

const MAX_EMAILS = 200;
const FETCH_DAYS = 7;
const FETCH_CONCURRENCY = 12;
const CLASSIFY_BATCH_SIZE = 15;
const MAX_DRAFTS = 5;
const TOP_COUNT = 5;
const RUN_STALE_MS = 5 * 60 * 1000;
const RUN_COOLDOWN_MS = 60 * 1000;

const URGENCIES = ["URGENT", "NEEDS_RESPONSE", "FYI", "LOW"];
const CATEGORIES = ["MEETING", "QUESTION", "NEWSLETTER", "TRANSACTIONAL", "PROMOTION", "NOTIFICATION", "PERSONAL", "OTHER"];
const DRAFTABLE_CATEGORIES = new Set(["MEETING", "QUESTION", "PERSONAL"]);
const URGENCY_WEIGHT = { URGENT: 100, NEEDS_RESPONSE: 70, FYI: 20, LOW: 5 };

// ---------- Run lifecycle (async, polled from the UI — same pattern as GitPersona) ----------

export const startRun = async (userId) => {
  const conn = await gmail.getConnection(userId);
  if (!conn.connected) throw new ApiError(400, "Connect your Gmail account first");

  const existing = await prisma.inboxRun.findUnique({ where: { userId } });
  if (existing?.status === "pending" && Date.now() - existing.startedAt.getTime() < RUN_STALE_MS) {
    return { status: "pending", step: existing.step, startedAt: existing.startedAt };
  }
  if (existing?.finishedAt && Date.now() - existing.finishedAt.getTime() < RUN_COOLDOWN_MS) {
    throw new ApiError(429, "You just ran a triage — wait a minute before running again");
  }

  const run = await prisma.inboxRun.upsert({
    where: { userId },
    update: { status: "pending", step: "fetching", error: null, totalFetched: 0, classified: 0, draftsCreated: 0, startedAt: new Date(), finishedAt: null },
    create: { userId, status: "pending", step: "fetching" },
  });

  runPipeline(userId).catch(() => {});
  return { status: "pending", step: run.step, startedAt: run.startedAt };
};

export const getRunStatus = async (userId) => {
  const run = await prisma.inboxRun.findUnique({ where: { userId } });
  if (!run) return { status: "idle" };
  if (run.status === "pending" && Date.now() - run.startedAt.getTime() > RUN_STALE_MS) {
    return { status: "failed", error: "The run timed out — please try again", startedAt: run.startedAt };
  }
  return {
    status: run.status,
    step: run.step,
    error: run.error || null,
    totalFetched: run.totalFetched,
    classified: run.classified,
    draftsCreated: run.draftsCreated,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
  };
};

const setStep = (userId, step, data = {}) =>
  prisma.inboxRun.update({ where: { userId }, data: { step, ...data } }).catch(() => {});

const runPipeline = async (userId) => {
  try {
    const token = await gmail.getAccessToken(userId);
    const conn = await prisma.gmailConnection.findUnique({ where: { userId } });
    const selfEmail = (conn?.googleEmail || "").toLowerCase();

    // 1. Fetch recent inbox
    const ids = await gmail.listRecentMessageIds(token, { days: FETCH_DAYS, max: MAX_EMAILS });
    const emails = [];
    for (let i = 0; i < ids.length; i += FETCH_CONCURRENCY) {
      const batch = await Promise.all(
        ids.slice(i, i + FETCH_CONCURRENCY).map((id) => gmail.getMessage(token, id).catch(() => null))
      );
      emails.push(...batch.filter(Boolean));
    }
    const inbox = emails.filter((e) => e.fromEmail && e.fromEmail !== selfEmail);
    await setStep(userId, "classifying", { totalFetched: inbox.length });

    // 2. Heuristic pre-filter: bulk mail skips the AI pass entirely
    const bulk = inbox.filter((e) => e.isBulk);
    const candidates = inbox.filter((e) => !e.isBulk);

    // 3. Batched AI classification
    const classified = new Map();
    for (let i = 0; i < candidates.length; i += CLASSIFY_BATCH_SIZE) {
      const batch = candidates.slice(i, i + CLASSIFY_BATCH_SIZE);
      const results = await classifyBatch(batch, selfEmail);
      for (const r of results) classified.set(r.gmailId, r);
      await setStep(userId, "classifying", { classified: classified.size });
    }

    // 4. Deterministic ranking for "must do today"
    const now = Date.now();
    const scored = candidates.map((e) => {
      const c = classified.get(e.gmailId) || { urgency: "FYI", category: "OTHER", reason: null, needsReply: false };
      const daysWaiting = Math.min(7, (now - e.receivedAt.getTime()) / 86_400_000);
      const score =
        (URGENCY_WEIGHT[c.urgency] || 0) + Math.round(daysWaiting * 6) + (c.needsReply ? 15 : 0);
      return { ...e, ...c, score };
    });

    const top = [...scored]
      .filter((e) => e.urgency === "URGENT" || e.urgency === "NEEDS_RESPONSE")
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_COUNT);
    top.forEach((e, i) => (e.topRank = i + 1));

    // 5. Draft replies for routine emails → real Gmail drafts (never sent)
    await setStep(userId, "drafting");
    const draftTargets = scored
      .filter((e) => e.needsReply && DRAFTABLE_CATEGORIES.has(e.category))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_DRAFTS);

    let draftsCreated = 0;
    for (const e of draftTargets) {
      try {
        const body = await generateDraft(token, e, selfEmail);
        const { draftId, messageId } = await gmail.createDraftReply(token, {
          to: e.fromName ? `${e.fromName} <${e.fromEmail}>` : e.fromEmail,
          subject: e.subject,
          body,
          threadId: e.threadId,
          messageIdHeader: e.messageIdHeader,
          references: e.references,
        });
        e.draftId = draftId;
        e.draftMessageId = messageId;
        e.draftBody = body;
        draftsCreated++;
        await setStep(userId, "drafting", { draftsCreated });
      } catch {
        // One bad draft shouldn't fail the whole run
      }
    }

    // 6. Persist a fresh snapshot
    const bulkCategory = (e) =>
      e.labelIds?.includes("CATEGORY_PROMOTIONS")
        ? "PROMOTION"
        : e.labelIds?.includes("CATEGORY_UPDATES")
          ? "NOTIFICATION"
          : "NEWSLETTER";
    const rows = [...scored, ...bulk.map((e) => ({ ...e, urgency: "LOW", category: bulkCategory(e), reason: null, score: 0 }))];
    await prisma.$transaction([
      prisma.inboxEmail.deleteMany({ where: { userId } }),
      prisma.inboxEmail.createMany({
        data: rows.map((e) => ({
          userId,
          gmailId: e.gmailId,
          threadId: e.threadId,
          fromName: e.fromName,
          fromEmail: e.fromEmail,
          subject: e.subject.slice(0, 500),
          snippet: e.snippet,
          body: e.body ? e.body.slice(0, 3000) : null,
          receivedAt: e.receivedAt,
          isBulk: !!e.isBulk,
          urgency: e.urgency || null,
          category: e.category || null,
          reason: e.reason || null,
          score: e.score || 0,
          topRank: e.topRank || null,
          draftId: e.draftId || null,
          draftMessageId: e.draftMessageId || null,
          draftBody: e.draftBody || null,
        })),
        skipDuplicates: true,
      }),
      prisma.gmailConnection.update({ where: { userId }, data: { lastSyncedAt: new Date() } }),
      prisma.inboxRun.update({
        where: { userId },
        data: { status: "completed", step: null, classified: classified.size, draftsCreated, finishedAt: new Date() },
      }),
    ]);
  } catch (err) {
    await prisma.inboxRun
      .update({
        where: { userId },
        data: { status: "failed", step: null, error: err?.message || "Inbox triage failed", finishedAt: new Date() },
      })
      .catch(() => {});
  }
};

// ---------- AI: classification ----------

const classificationPrompt = (batch, selfEmail) => `You are triaging a user's Gmail inbox. The user's email is ${selfEmail}.
For each email below, classify:
- urgency: one of ${URGENCIES.join(", ")}. URGENT = time-sensitive and blocking the user today. NEEDS_RESPONSE = expects a reply from the user but not on fire. FYI = informational, no action. LOW = noise.
- category: one of ${CATEGORIES.join(", ")}.
- reason: one short sentence (max 15 words) a human would find useful, e.g. "Waiting on your approval since Tuesday". Ground it in the email content.
- needsReply: true only if the sender is clearly expecting a reply from the user.

Emails:
${batch
  .map(
    (e, i) =>
      `[${i}] from: ${e.fromName || ""} <${e.fromEmail}> | subject: ${e.subject} | received: ${e.receivedAt.toISOString()} | body: ${(e.body || e.snippet || "").slice(0, 600)}`
  )
  .join("\n")}

Respond with ONLY a JSON array (no markdown fences), one object per email, in the same order:
[{"i": 0, "urgency": "...", "category": "...", "reason": "...", "needsReply": false}]`;

const parseJson = (text) => {
  let cleaned = (text || "").trim();
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
};

const classifyBatch = async (batch, selfEmail, attempt = 0) => {
  try {
    // Same prompt is sent to all configured AI providers (Anthropic + Groq
    // models); the responses are compared and the best valid one is used.
    const best = await getBestResponse({
      prompt: classificationPrompt(batch, selfEmail),
      maxTokens: 2500,
      validate: (text) => {
        const parsed = parseJson(text);
        if (!Array.isArray(parsed)) throw new Error("not an array");
        return parsed;
      },
    });
    const parsed = best.parsed;

    return batch.map((e, i) => {
      const r = parsed.find((x) => x.i === i) || parsed[i] || {};
      return {
        gmailId: e.gmailId,
        urgency: URGENCIES.includes(r.urgency) ? r.urgency : "FYI",
        category: CATEGORIES.includes(r.category) ? r.category : "OTHER",
        reason: typeof r.reason === "string" ? r.reason.slice(0, 200) : null,
        needsReply: !!r.needsReply,
      };
    });
  } catch (err) {
    if (attempt === 0) return classifyBatch(batch, selfEmail, 1);
    // Fallback: keep the pipeline alive with neutral labels
    return batch.map((e) => ({ gmailId: e.gmailId, urgency: "FYI", category: "OTHER", reason: null, needsReply: false }));
  }
};

// ---------- AI: draft generation ----------

const draftPrompt = (email, thread, selfEmail) => `Write a reply to the email below on behalf of the user (${selfEmail}).

Rules:
- Match the sender's formality level; keep it concise and natural.
- NEVER invent facts, dates, times, or commitments. If information is needed that you don't have (a specific time, a decision, a number), insert a bracketed placeholder like [confirm time] instead of guessing.
- No subject line, no signature block — body text only, starting with an appropriate greeting.

Original email from ${email.fromName || email.fromEmail}:
Subject: ${email.subject}
${email.body || email.snippet || ""}
${
  thread.length > 1
    ? `\nEarlier messages in this thread (oldest first):\n${thread
        .slice(0, -1)
        .map((m) => `From ${m.from} on ${m.date}: ${m.body.slice(0, 400)}`)
        .join("\n---\n")}`
    : ""
}

Respond with ONLY the reply body text.`;

const generateDraft = async (token, email, selfEmail) => {
  const thread = await gmail.getThreadContext(token, email.threadId).catch(() => []);
  // Same prompt is sent to all configured AI providers; best reply wins.
  const best = await getBestResponse({
    prompt: draftPrompt(email, thread, selfEmail),
    maxTokens: 800,
    validate: (text) => {
      const body = (text || "").trim();
      if (!body) throw new Error("empty draft");
      return body;
    },
  });
  return best.parsed;
};

// ---------- Dashboard read model ----------

export const getOverview = async (userId) => {
  const connection = await gmail.getConnection(userId);
  if (!connection.connected) return { connection, top: [], drafts: [], triage: [] };

  const emails = await prisma.inboxEmail.findMany({
    where: { userId },
    orderBy: [{ score: "desc" }, { receivedAt: "desc" }],
  });

  const top = emails.filter((e) => e.topRank).sort((a, b) => a.topRank - b.topRank);
  const drafts = emails.filter((e) => e.draftId);
  const rest = emails.filter((e) => !e.topRank);

  const byCategory = new Map();
  for (const e of rest) {
    const key = e.category || "OTHER";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(e);
  }
  const triage = [...byCategory.entries()]
    .map(([category, items]) => ({ category, count: items.length, items: items.slice(0, 25) }))
    .sort((a, b) => b.count - a.count);

  return { connection, top, drafts, triage, total: emails.length };
};
