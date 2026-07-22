import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { getInstallationToken } from "./GithubService.js";
import { getBestResponse } from "./AiService.js";

const GITHUB_API = "https://api.github.com";
const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

const getUserGithubConnections = async (userId) => {
  const memberships = await prisma.teamMembership.findMany({ where: { userId }, select: { teamId: true } });
  const teamIds = memberships.map((m) => m.teamId);
  if (teamIds.length === 0) return [];
  return prisma.githubConnection.findMany({
    where: { teamId: { in: teamIds }, active: true, installationId: { not: null } },
  });
};

const resolvePersonaIdentity = async (userId) => {
  const connections = await getUserGithubConnections(userId);
  if (connections.length === 0) {
    throw new ApiError(
      400,
      "Connect GitHub first from Settings → Connected accounts — GitPersona uses that same connection."
    );
  }
  const primary = connections.find((c) => c.accountType === "User") || connections[0];
  return { connections, username: primary.account };
};

const MAX_REPOS = 20;

const listInstallationRepos = async (installationId) => {
  const token = await getInstallationToken(installationId);
  const headers = ghHeaders(token);
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`${GITHUB_API}/installation/repositories?per_page=100&page=${page}`, { headers });
    if (!res.ok) break;
    // eslint-disable-next-line no-await-in-loop
    const data = await res.json();
    const batch = data.repositories || [];
    repos.push(...batch.map((r) => ({ ...r, __token: token })));
    if (batch.length < 100) break;
  }
  return repos;
};

const collectRepos = async (connections) => {
  const byFullName = new Map();
  for (const conn of connections) {
    // eslint-disable-next-line no-await-in-loop
    const repos = await listInstallationRepos(conn.installationId).catch(() => []);
    for (const r of repos) {
      if (!byFullName.has(r.full_name)) byFullName.set(r.full_name, r);
    }
  }
  return [...byFullName.values()]
    .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))
    .slice(0, MAX_REPOS);
};

const fetchGithubStats = async (connections, githubUsername) => {
  const repos = await collectRepos(connections);
  if (repos.length === 0) {
    throw new ApiError(
      400,
      "No repositories are visible yet — open your GitHub installation and grant it access to at least one repo."
    );
  }

  const languageBytes = {};
  let totalStars = 0;
  const repoSummaries = [];
  let anyAuthoredCommit = false;

  for (const repo of repos) {
    const headers = ghHeaders(repo.__token);
    totalStars += repo.stargazers_count || 0;

    // eslint-disable-next-line no-await-in-loop
    const langRes = await fetch(`${GITHUB_API}/repos/${repo.full_name}/languages`, { headers }).catch(() => null);
    if (langRes?.ok) {
      // eslint-disable-next-line no-await-in-loop
      const langs = await langRes.json();
      for (const [lang, bytes] of Object.entries(langs)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
    } else if (repo.language) {
      languageBytes[repo.language] = (languageBytes[repo.language] || 0) + 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const commitsRes = await fetch(
      `${GITHUB_API}/repos/${repo.full_name}/commits?author=${encodeURIComponent(githubUsername)}&per_page=30`,
      { headers }
    ).catch(() => null);
    let commitCount = 0;
    let sampleMessages = [];
    if (commitsRes?.ok) {
      // eslint-disable-next-line no-await-in-loop
      const commits = await commitsRes.json();
      if (Array.isArray(commits)) {
        commitCount = commits.length;
        sampleMessages = commits
          .slice(0, 5)
          .map((c) => c.commit?.message?.split("\n")[0])
          .filter(Boolean);
        if (commitCount > 0) anyAuthoredCommit = true;
      }
    }

    if (commitCount === 0) continue;

    repoSummaries.push({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      pushedAt: repo.pushed_at,
      createdAt: repo.created_at,
      recentCommitCount: commitCount,
      sampleCommitMessages: sampleMessages,
      topics: repo.topics || [],
      __token: repo.__token,
    });
  }

  if (!anyAuthoredCommit) {
    throw new ApiError(
      400,
      `No commits by "${githubUsername}" were found in the repositories your teams have connected.`
    );
  }

  const totalLanguageBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0) || 1;
  const topLanguages = Object.entries(languageBytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, bytes]) => ({
      language,
      percent: Math.round((bytes / totalLanguageBytes) * 100),
    }));

  const byCreated = [...repoSummaries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const oldestRepo = byCreated[0];
  const newestRepo = byCreated[byCreated.length - 1];

  return {
    reposAnalyzed: repoSummaries.length,
    totalStars,
    topLanguages,
    repos: repoSummaries,
    earliestRepo: oldestRepo
      ? { name: oldestRepo.name, createdAt: oldestRepo.createdAt, language: oldestRepo.language }
      : null,
    mostRecentRepo: newestRepo
      ? { name: newestRepo.name, createdAt: newestRepo.createdAt, language: newestRepo.language }
      : null,
    anyToken: repoSummaries[0]?.__token || null,
  };
};

const fetchProfile = async (username, token) => {
  try {
    const res = await fetch(`${GITHUB_API}/users/${username}`, {
      headers: token ? ghHeaders(token) : { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return { avatarUrl: data.avatar_url || null, name: data.name || null };
  } catch {
    return {};
  }
};

const BANNED_PHRASES = ["passionate developer", "team player", "hard worker", "detail-oriented", "go-getter"];

const buildPrompt = (login, stats) => `You are analyzing a real developer's GitHub activity (from repositories their team has connected) to generate an evidence-based "developer identity card". Every claim you make MUST cite specific evidence from the data below (a language percentage, a repo name, a commit count, a star count). Never use generic filler phrases like: ${BANNED_PHRASES.join(", ")}.

GitHub username: ${login}
Repositories analyzed (repos they've actually committed to): ${stats.reposAnalyzed}
Total stars across analyzed repos: ${stats.totalStars}
Top languages: ${stats.topLanguages.map((l) => `${l.language} (${l.percent}%)`).join(", ") || "none detected"}
Earliest repo: ${stats.earliestRepo ? `${stats.earliestRepo.name} (${stats.earliestRepo.language || "unknown"}, created ${stats.earliestRepo.createdAt})` : "unknown"}
Most recent repo: ${stats.mostRecentRepo ? `${stats.mostRecentRepo.name} (${stats.mostRecentRepo.language || "unknown"}, created ${stats.mostRecentRepo.createdAt})` : "unknown"}

Per-repo detail:
${stats.repos
  .map(
    (r) =>
      `- ${r.name}: ${r.language || "unknown"}, ${r.stars} stars, ${r.recentCommitCount} recent commits by this user, topics: [${r.topics.join(", ")}]${r.description ? `, description: "${r.description}"` : ""}`
  )
  .join("\n")}

Note: this analysis is scoped to repositories connected to the person's Linear workspace, not their entire public GitHub history — write the style summary and strengths naturally without claiming broader coverage than this data supports.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "styleSummary": "2-3 sentences describing their coding style, citing specific evidence",
  "strengths": [
    { "title": "short strength title", "evidence": "1-2 sentences citing specific data" }
  ],
  "growthArc": "2-3 sentences comparing their earliest vs. most recent repo activity to describe how their skills/stack have evolved within this data. If there isn't enough history, describe their current trajectory honestly instead of inventing a history.",
  "roadmap": [
    { "title": "short recommendation title", "why": "1-2 sentences explaining the gap this addresses, grounded in the data", "resourceHint": "a concrete type of resource, e.g. 'a testing framework course' or 'an open-source project with a mature CI setup to study'" }
  ]
}
Provide exactly 3 strengths and exactly 4 roadmap items.`;

const parseAnalysis = (text) => {
  let cleaned = (text || "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new ApiError(502, "AI analysis returned an unexpected format — try regenerating");
  }
};

const GENERATION_STALE_MS = 3 * 60 * 1000;

export const startGenerateCard = async (userId) => {
  const existing = await prisma.gitPersonaGeneration.findUnique({ where: { userId } });
  if (existing?.status === "pending" && Date.now() - existing.startedAt.getTime() < GENERATION_STALE_MS) {
    return { status: "pending", startedAt: existing.startedAt };
  }

  const gen = await prisma.gitPersonaGeneration.upsert({
    where: { userId },
    update: { status: "pending", startedAt: new Date(), error: null },
    create: { userId, status: "pending" },
  });

  runGeneration(userId).catch((err) => {
  });

  return { status: "pending", startedAt: gen.startedAt };
};

const runGeneration = async (userId) => {
  try {
    const { connections, username } = await resolvePersonaIdentity(userId);
    const stats = await fetchGithubStats(connections, username);
    const profile = await fetchProfile(username, stats.anyToken);

    // Same prompt goes to all configured AI providers (Anthropic + Groq models);
    // the responses are compared and the best valid one is used.
    const best = await getBestResponse({
      prompt: buildPrompt(username, stats),
      maxTokens: 2000,
      validate: (text) => {
        const a = parseAnalysis(text);
        if (!a?.styleSummary || !Array.isArray(a.strengths) || !a.growthArc || !Array.isArray(a.roadmap)) {
          throw new Error("missing required fields");
        }
        return a;
      },
    });
    const analysis = best.parsed;

    const statsSnapshot = {
      reposAnalyzed: stats.reposAnalyzed,
      totalStars: stats.totalStars,
      topLanguages: stats.topLanguages,
    };

    await prisma.gitPersonaCard.upsert({
      where: { userId },
      update: {
        githubLogin: username,
        avatarUrl: profile.avatarUrl,
        name: profile.name,
        styleSummary: analysis.styleSummary,
        strengths: analysis.strengths,
        growthArc: analysis.growthArc,
        roadmap: analysis.roadmap,
        stats: statsSnapshot,
        generatedAt: new Date(),
      },
      create: {
        userId,
        githubLogin: username,
        avatarUrl: profile.avatarUrl,
        name: profile.name,
        styleSummary: analysis.styleSummary,
        strengths: analysis.strengths,
        growthArc: analysis.growthArc,
        roadmap: analysis.roadmap,
        stats: statsSnapshot,
      },
    });
    await prisma.gitPersonaGeneration.delete({ where: { userId } }).catch(() => {});
  } catch (err) {
    await prisma.gitPersonaGeneration
      .update({
        where: { userId },
        data: { status: "failed", error: err?.message || "Card generation failed" },
      })
      .catch(() => {});
  }
};

export const getGenerationStatus = async (userId) => {
  const gen = await prisma.gitPersonaGeneration.findUnique({ where: { userId } });
  if (!gen) return { status: "idle" };

  if (gen.status === "pending" && Date.now() - gen.startedAt.getTime() > GENERATION_STALE_MS) {
    return { status: "failed", error: "Generation timed out — please try again", startedAt: gen.startedAt };
  }
  return { status: gen.status, error: gen.error || null, startedAt: gen.startedAt };
};

export const getCard = async (userId) => {
  const card = await prisma.gitPersonaCard.findUnique({ where: { userId } });
  if (!card) throw new ApiError(404, "No developer card generated yet");
  return card;
};

export const setCardVisibility = async (userId, isPublic) => {
  const card = await prisma.gitPersonaCard.findUnique({ where: { userId } });
  if (!card) throw new ApiError(404, "No developer card generated yet");
  return prisma.gitPersonaCard.update({ where: { userId }, data: { public: !!isPublic } });
};

export const getPublicCard = async (login) => {
  const card = await prisma.gitPersonaCard.findFirst({
    where: { githubLogin: { equals: login, mode: "insensitive" }, public: true },
  });
  if (!card) throw new ApiError(404, "This developer card isn't available");
  return card;
};
