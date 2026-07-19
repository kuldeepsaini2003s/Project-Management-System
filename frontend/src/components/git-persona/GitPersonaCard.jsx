import { Star, GitBranch, Sparkles, TrendingUp, Compass } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";

const LANGUAGE_COLORS = ["#5e6ad2", "#26a269", "#d9920a", "#d64545", "#9046c0", "#2a8fbd", "#c2410c", "#0d9488"];

function LanguageBar({ topLanguages = [] }) {
  if (!topLanguages.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-hover">
        {topLanguages.map((l, i) => (
          <div
            key={l.language}
            style={{ width: `${l.percent}%`, backgroundColor: LANGUAGE_COLORS[i % LANGUAGE_COLORS.length] }}
            title={`${l.language} — ${l.percent}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {topLanguages.slice(0, 5).map((l, i) => (
          <span key={l.language} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: LANGUAGE_COLORS[i % LANGUAGE_COLORS.length] }}
            />
            {l.language} <span className="text-fg-subtle">{l.percent}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The GitPersona developer identity card — used both on the personal
 * settings page and on the public shareable /dev/:login page.
 */
export default function GitPersonaCard({ card, avatarUrl, name, readOnly = false }) {
  if (!card) return null;
  const stats = card.stats || {};
  const strengths = card.strengths || [];
  const roadmap = card.roadmap || [];

  return (
    <div className="glass-card animate-fade-up overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-glass-border px-6 py-5">
        <Avatar name={name || card.githubLogin} src={avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-fg">{name || card.githubLogin}</h2>
            <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              <Sparkles className="h-3 w-3" />
              GitPersona
            </span>
          </div>
          <p className="mt-0.5 text-sm text-fg-muted">@{card.githubLogin}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-fg-subtle">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {stats.totalStars ?? 0} stars
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" />
              {stats.reposAnalyzed ?? 0} repos analyzed
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-5">
        {/* Languages */}
        {stats.topLanguages?.length > 0 && <LanguageBar topLanguages={stats.topLanguages} />}

        {/* Style summary */}
        <div>
          <p className="text-sm leading-relaxed text-fg">{card.styleSummary}</p>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              <Sparkles className="h-3.5 w-3.5" />
              Strengths
            </h3>
            <div className="flex flex-col gap-3">
              {strengths.map((s, i) => (
                <div key={i} className="rounded-lg border border-glass-border bg-surface/40 px-4 py-3">
                  <p className="text-sm font-medium text-fg">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{s.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth arc */}
        {card.growthArc && (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              <TrendingUp className="h-3.5 w-3.5" />
              Growth arc
            </h3>
            <p className="text-sm leading-relaxed text-fg-muted">{card.growthArc}</p>
          </div>
        )}

        {/* Roadmap */}
        {roadmap.length > 0 && (
          <div>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              <Compass className="h-3.5 w-3.5" />
              6-month roadmap
            </h3>
            <div className="flex flex-col gap-2.5">
              {roadmap.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">{r.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{r.why}</p>
                    {r.resourceHint && (
                      <p className="mt-1 text-xs italic text-fg-subtle">Try: {r.resourceHint}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-glass-border px-6 py-3">
        <p className="text-[11px] text-fg-subtle">
          Generated {card.generatedAt ? new Date(card.generatedAt).toLocaleDateString() : "just now"} from public
          GitHub activity
        </p>
        {!readOnly && <p className="text-[11px] text-fg-subtle">Shareable like a LinkedIn profile</p>}
      </div>
    </div>
  );
}
