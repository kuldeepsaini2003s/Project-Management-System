import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Multi-provider AI service.
 *
 * For every prompt we fan out to all configured text-capable providers
 * (Anthropic Claude + Groq-hosted models), then use a fast AI judge to pick
 * the best response among the valid candidates. Callers receive a single
 * best response — exactly the same contract as a single-provider call.
 *
 * Deepgram is also integrated below (client + transcription helper).
 * Note: Deepgram is a speech/audio API — it has no text-generation endpoint,
 * so it cannot participate in text-prompt comparisons.
 */

const ANTHROPIC_MODEL = "claude-sonnet-4-5";
const GROQ_MODEL_PRIMARY = "llama-3.3-70b-versatile";
const GROQ_MODEL_SECONDARY = "llama-3.1-8b-instant";
const JUDGE_MODEL = "llama-3.1-8b-instant";

const GROQ_API = "https://api.groq.com/openai/v1";
const DEEPGRAM_API = "https://api.deepgram.com/v1";

// ---------- Provider clients ----------

let anthropicClient = null;
const getAnthropic = () => {
  if (!env.anthropicApiKey) return null;
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: env.anthropicApiKey });
  return anthropicClient;
};

const promptAnthropic = async (prompt, maxTokens) => {
  const client = getAnthropic();
  if (!client) throw new Error("Anthropic is not configured");
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content?.find((b) => b.type === "text")?.text || "";
  if (!text.trim()) throw new Error("Anthropic returned an empty response");
  return text;
};

const promptGroq = async (model, prompt, maxTokens) => {
  if (!env.groqApiKey) throw new Error("Groq is not configured");
  const res = await fetch(`${GROQ_API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq (${model}) request failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new Error(`Groq (${model}) returned an empty response`);
  return text;
};

// ---------- Deepgram (speech-to-text) ----------

/**
 * Transcribe audio with Deepgram. Deepgram is audio-only, so it is exposed
 * as a transcription helper rather than as a text-prompt provider.
 * @param {Buffer|ArrayBuffer} audio - raw audio bytes
 * @param {string} mimetype - e.g. "audio/webm", "audio/wav"
 */
export const transcribeAudio = async (audio, mimetype = "audio/webm") => {
  if (!env.deepgramApiKey) throw new ApiError(500, "Deepgram is not configured on the server");
  const res = await fetch(`${DEEPGRAM_API}/listen?model=nova-2&smart_format=true`, {
    method: "POST",
    headers: {
      Authorization: `Token ${env.deepgramApiKey}`,
      "Content-Type": mimetype,
    },
    body: audio,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(502, `Deepgram transcription failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
};

// ---------- Ensemble: prompt all providers, judge, return the best ----------

const textProviders = () => {
  const providers = [];
  if (env.anthropicApiKey) {
    providers.push({
      provider: "anthropic",
      model: ANTHROPIC_MODEL,
      run: (prompt, maxTokens) => promptAnthropic(prompt, maxTokens),
    });
  }
  if (env.groqApiKey) {
    providers.push(
      {
        provider: "groq",
        model: GROQ_MODEL_PRIMARY,
        run: (prompt, maxTokens) => promptGroq(GROQ_MODEL_PRIMARY, prompt, maxTokens),
      },
      {
        provider: "groq",
        model: GROQ_MODEL_SECONDARY,
        run: (prompt, maxTokens) => promptGroq(GROQ_MODEL_SECONDARY, prompt, maxTokens),
      }
    );
  }
  return providers;
};

const LABELS = ["A", "B", "C", "D", "E"];

const judgePrompt = (originalPrompt, candidates) => `You are judging responses from different AI models to the same task. Pick the single best response: the one that follows the task's format requirements exactly, is accurate to the task's input data, and is the most useful.

The task given to the models was:
<task>
${originalPrompt.slice(0, 6000)}
</task>

Candidate responses:
${candidates
  .map((c, i) => `<response id="${LABELS[i]}">\n${c.text.slice(0, 4000)}\n</response>`)
  .join("\n")}

Respond with ONLY a JSON object, no other text: {"best": "A"}`;

const judgeBest = async (originalPrompt, candidates) => {
  const raw = await promptGroq(JUDGE_MODEL, judgePrompt(originalPrompt, candidates), 50);
  const match = raw.match(/"best"\s*:\s*"([A-E])"/i);
  if (!match) throw new Error("judge returned an unexpected format");
  const idx = LABELS.indexOf(match[1].toUpperCase());
  if (idx < 0 || idx >= candidates.length) throw new Error("judge picked an unknown candidate");
  return idx;
};

/**
 * Send the same prompt to every configured AI provider, compare the
 * responses, and return the best one.
 *
 * @param {object} opts
 * @param {string} opts.prompt - the prompt to send to every provider
 * @param {number} [opts.maxTokens=2000]
 * @param {(text: string) => any} [opts.validate] - optional validator/parser.
 *   Runs on each response; if it throws, that candidate is discarded.
 *   Its return value is exposed as `parsed` on the winning response.
 * @returns {Promise<{text: string, parsed: any, provider: string, model: string, candidates: Array<{provider: string, model: string, ok: boolean, error?: string}>}>}
 */
export const getBestResponse = async ({ prompt, maxTokens = 2000, validate }) => {
  const providers = textProviders();
  if (providers.length === 0) throw new ApiError(500, "No AI provider is configured on the server");

  const settled = await Promise.allSettled(providers.map((p) => p.run(prompt, maxTokens)));

  const candidates = [];
  const report = [];
  settled.forEach((result, i) => {
    const { provider, model } = providers[i];
    if (result.status !== "fulfilled") {
      report.push({ provider, model, ok: false, error: result.reason?.message || "request failed" });
      return;
    }
    let parsed;
    try {
      parsed = validate ? validate(result.value) : undefined;
    } catch (err) {
      report.push({ provider, model, ok: false, error: `invalid response: ${err?.message || "validation failed"}` });
      return;
    }
    candidates.push({ provider, model, text: result.value, parsed });
    report.push({ provider, model, ok: true });
  });

  if (candidates.length === 0) {
    throw new ApiError(502, "All AI providers failed to produce a valid response");
  }

  let winner = candidates[0];
  if (candidates.length > 1) {
    try {
      winner = candidates[await judgeBest(prompt, candidates)];
    } catch {
      // Judge unavailable — prefer Anthropic, otherwise the first valid response
      winner = candidates.find((c) => c.provider === "anthropic") || candidates[0];
    }
  }

  return { text: winner.text, parsed: winner.parsed, provider: winner.provider, model: winner.model, candidates: report };
};
