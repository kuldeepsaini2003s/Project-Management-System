import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Search, X, CircleDot, Box, FileText, Clock, Menu } from "lucide-react";
import IssueDetailView from "../components/issues/IssueDetailView.jsx";
import ProjectStatusBadge from "../components/projects/ProjectStatusBadge.jsx";
import { ISSUE_STATUSES } from "../constants/issueStatus.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { workspaceService } from "../services/workspaceService.js";
import { SEARCH_HISTORY_KEY } from "../utils/constants.js";

const TABS = ["All", "Issues", "Projects", "Documents"];

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

export default function SearchPage() {
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const { currentId } = useWorkspace();

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState("All");
  const [results, setResults] = useState({ issues: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // { type, id, project? }
  const [history, setHistory] = useState(loadHistory);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce the query (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch when the debounced query changes.
  useEffect(() => {
    if (!debounced || !currentId) {
      setResults({ issues: [], projects: [] });
      return;
    }
    let active = true;
    setLoading(true);
    workspaceService
      .search(currentId, debounced)
      .then((d) => active && setResults(d))
      .catch(() => active && setResults({ issues: [], projects: [] }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debounced, currentId]);

  const saveHistory = (term) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter((h) => h !== t)].slice(0, 8);
    setHistory(next);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const showIssues = tab === "All" || tab === "Issues";
  const showProjects = tab === "All" || tab === "Projects";

  const items = useMemo(() => {
    const list = [];
    if (showIssues) results.issues.forEach((i) => list.push({ type: "issue", ...i }));
    if (showProjects) results.projects.forEach((p) => list.push({ type: "project", ...p }));
    return list;
  }, [results, showIssues, showProjects]);

  const select = (item) => {
    saveHistory(q);
    setSelected(item);
  };

  const hasQuery = debounced.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Header: search input + tabs */}
      <div className="glass relative z-40 flex shrink-0 flex-col gap-2 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenu}
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Search className="h-4 w-4 shrink-0 text-fg-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveHistory(q)}
            placeholder="Search issues, projects, and documents…"
            className="h-8 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                tab === t ? "bg-surface-hover font-medium text-fg" : "text-fg-muted hover:text-fg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="glass flex min-h-0 flex-1 overflow-hidden rounded-lg">
        {!hasQuery ? (
          <RecentOrEmpty history={history} onPick={(h) => setQ(h)} onClear={clearHistory} />
        ) : (
          <>
            {/* Results list — full width until a result is selected, then a left column */}
            <div
              className={`min-h-0 overflow-y-auto border-glass-border ${
                selected
                  ? "hidden w-full shrink-0 lg:block lg:w-96 lg:border-r"
                  : "block w-full"
              }`}
            >
              {loading && items.length === 0 ? (
                <p className="py-10 text-center text-sm text-fg-muted">Searching…</p>
              ) : items.length === 0 ? (
                <p className="py-10 text-center text-sm text-fg-subtle">No results</p>
              ) : (
                <ul className="divide-y divide-glass-border">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <ResultRow
                        item={item}
                        active={selected?.type === item.type && selected?.id === item.id}
                        onClick={() => select(item)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {tab === "Documents" && (
                <p className="py-10 text-center text-sm text-fg-subtle">No documents</p>
              )}
            </div>

            {/* Right: detail — only shown once a result is selected */}
            {selected && (
              <div className="flex min-w-0 flex-1 flex-col">
                {selected.type === "issue" ? (
                  <div className="min-h-0 flex-1">
                    <IssueDetailView issueId={selected.id} />
                  </div>
                ) : (
                  <ProjectPreview
                    project={selected}
                    onOpen={() => navigate(`/projects/${selected.id}`)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecentOrEmpty({ history, onPick, onClear }) {
  if (history.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-fg-subtle">
        <Search className="h-10 w-10" />
        <p className="text-sm font-medium text-fg">Search</p>
        <p className="text-sm">Find issues, projects, and documents</p>
      </div>
    );
  }
  return (
    <div className="w-full overflow-y-auto p-3">
      <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
        Recent searches
      </p>
      <ul>
        {history.map((h) => (
          <li key={h}>
            <button
              onClick={() => onPick(h)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-fg hover:bg-surface-hover"
            >
              <Clock className="h-3.5 w-3.5 text-fg-subtle" />
              {h}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onClear}
        className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-fg-muted hover:bg-surface-hover hover:text-fg"
      >
        <X className="h-3.5 w-3.5" />
        Clear history
      </button>
    </div>
  );
}

function ResultRow({ item, active, onClick }) {
  const isIssue = item.type === "issue";
  const meta = isIssue ? ISSUE_STATUSES[item.status] || ISSUE_STATUSES.TODO : null;
  const Icon = isIssue ? meta.icon : Box;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover ${
        active ? "bg-surface-hover" : ""
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" style={isIssue ? { color: meta.color } : undefined} />
      {isIssue && <span className="shrink-0 text-xs text-fg-subtle">{item.identifier}</span>}
      <span className="min-w-0 flex-1 truncate text-sm text-fg">
        {isIssue ? item.title : item.name}
      </span>
      <span className="shrink-0 text-[11px] text-fg-subtle">{isIssue ? "Issue" : "Project"}</span>
    </button>
  );
}

function ProjectPreview({ project, onOpen }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: (project.color || "#5e6ad2") + "22", color: project.color || "#5e6ad2" }}
        >
          {project.icon ? <span aria-hidden="true">{project.icon}</span> : <Box className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-fg">{project.name}</h1>
          <p className="text-xs text-fg-subtle">{project.teamName}</p>
        </div>
      </div>
      <div className="mt-4">
        <ProjectStatusBadge status={project.status} />
      </div>
      <button
        onClick={onOpen}
        className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-hover"
      >
        Open project
      </button>
    </div>
  );
}
