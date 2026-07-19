/**
 * Custom skeleton loader system.
 *
 * Usage:
 *   <Skeleton name="issue-board" loading={loading && issues.length === 0}>
 *     <IssueBoard ... />
 *   </Skeleton>
 *
 * Each named skeleton mirrors the real layout at natural dimensions.
 */

/* ── Base shimmer primitive ──────────────────────────────────────── */
export function Sk({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/* ──────────────────────────────────────────────────────────────────
   Kanban board (issues)
   5 columns × variable card counts
────────────────────────────────────────────────────────────────── */
const ISSUE_COL_COUNTS = [3, 4, 2, 5, 1];

function IssueBoardSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 pb-4 pt-2">
      {ISSUE_COL_COUNTS.map((count, ci) => (
        <div key={ci} className="flex w-72 shrink-0 flex-col gap-2">
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 py-1.5">
            <Sk className="h-3.5 w-3.5 rounded-full" />
            <Sk className="h-3 w-20 rounded" />
            <Sk className="ml-auto h-3 w-5 rounded" />
          </div>
          {/* Cards */}
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-glass-border bg-surface/40 p-3">
              <Sk className="h-3.5 w-full rounded" />
              {i % 2 === 0 && <Sk className="h-3 w-4/5 rounded" />}
              <div className="flex items-center gap-2 pt-1">
                <Sk className="h-3 w-12 rounded" />
                <Sk className="ml-auto h-5 w-5 rounded-full" />
              </div>
            </div>
          ))}
          {/* Add card */}
          <Sk className="h-8 w-full rounded-lg opacity-50" />
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Kanban board (projects)
   5 columns with richer cards
────────────────────────────────────────────────────────────────── */
const PROJECT_COL_COUNTS = [2, 3, 1, 2, 1];

function ProjectBoardSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 pb-4 pt-2">
      {PROJECT_COL_COUNTS.map((count, ci) => (
        <div key={ci} className="flex w-72 shrink-0 flex-col gap-2">
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 py-1.5">
            <Sk className="h-3.5 w-3.5 rounded-full" />
            <Sk className="h-3 w-24 rounded" />
            <Sk className="ml-auto h-3 w-5 rounded" />
          </div>
          {/* Cards */}
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-glass-border bg-surface/40 p-3">
              <div className="flex items-center gap-2">
                <Sk className="h-4 w-4 shrink-0 rounded" />
                <Sk className="h-3.5 flex-1 rounded" />
              </div>
              <Sk className="h-3 w-4/5 rounded" />
              <div className="flex items-center gap-2 pt-1">
                <Sk className="h-3 w-16 rounded" />
                <Sk className="ml-auto h-3 w-10 rounded" />
              </div>
            </div>
          ))}
          {/* Add card */}
          <Sk className="h-8 w-full rounded-lg opacity-50" />
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Issue detail (two-column: main content + sidebar)
────────────────────────────────────────────────────────────────── */
function IssueDetailSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      {/* Main */}
      <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {/* Title */}
          <Sk className="h-8 w-4/5 rounded-lg" />
          <Sk className="mt-3 h-8 w-3/5 rounded-lg" />
          {/* Description */}
          <div className="mt-8 space-y-2">
            <Sk className="h-4 w-full rounded" />
            <Sk className="h-4 w-full rounded" />
            <Sk className="h-4 w-11/12 rounded" />
            <Sk className="h-4 w-3/4 rounded" />
            <Sk className="h-4 w-full rounded" />
            <Sk className="h-4 w-2/3 rounded" />
          </div>
          {/* Attach image btn */}
          <Sk className="mt-5 h-8 w-32 rounded-md" />
          {/* Sub-issues */}
          <div className="mt-10">
            <Sk className="h-4 w-20 rounded" />
            <div className="mt-2 space-y-2">
              <Sk className="h-10 w-full rounded-md" />
              <Sk className="h-10 w-full rounded-md" />
            </div>
          </div>
          {/* Activity */}
          <div className="mt-10">
            <Sk className="h-4 w-16 rounded" />
            <div className="mt-3 flex items-center gap-2">
              <Sk className="h-8 w-8 shrink-0 rounded-full" />
              <Sk className="h-4 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full shrink-0 border-t border-glass-border p-5 lg:w-72 lg:border-l lg:border-t-0">
        {["Status", "Priority", "Assignee", "Labels", "Project", "Repository", "Pull requests"].map((label) => (
          <div key={label} className="mb-5 border-b border-glass-border pb-5 last:border-0">
            <Sk className="mb-2 h-3 w-16 rounded" />
            <Sk className="h-7 w-full rounded-md" />
          </div>
        ))}
      </aside>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Members table (WorkspaceMembersPage)
   Avatars + name / email / role / teams / last seen
────────────────────────────────────────────────────────────────── */
function MembersListSkeleton() {
  return (
    <div className="glass min-h-0 flex-1 overflow-auto rounded-lg p-4 sm:p-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass-border">
            <th className="whitespace-nowrap px-4 py-2 text-left"><Sk className="h-3 w-10 rounded" /></th>
            <th className="hidden whitespace-nowrap px-4 py-2 sm:table-cell"><Sk className="h-3 w-12 rounded" /></th>
            <th className="hidden whitespace-nowrap px-4 py-2 md:table-cell"><Sk className="h-3 w-10 rounded" /></th>
            <th className="hidden whitespace-nowrap px-4 py-2 lg:table-cell"><Sk className="h-3 w-10 rounded" /></th>
            <th className="whitespace-nowrap px-4 py-2 text-right"><Sk className="ml-auto h-3 w-16 rounded" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-glass-border/60">
              <td className="w-full px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Sk className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="space-y-1.5">
                    <Sk className="h-3.5 w-28 rounded" />
                    <Sk className="h-3 w-20 rounded" />
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-2.5 sm:table-cell">
                <Sk className="h-5 w-14 rounded-md" />
              </td>
              <td className="hidden px-4 py-2.5 md:table-cell">
                <Sk className="h-3.5 w-16 rounded" />
              </td>
              <td className="hidden px-4 py-2.5 lg:table-cell">
                <Sk className="h-5 w-20 rounded-full" />
              </td>
              <td className="px-4 py-2.5 text-right">
                <Sk className="ml-auto h-3.5 w-12 rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Teams list (TeamsListPage)
   Team glyph + name + key / membership / member avatars / projects
────────────────────────────────────────────────────────────────── */
function TeamsListSkeleton() {
  return (
    <div className="glass min-h-0 flex-1 overflow-auto rounded-lg p-4 sm:p-5">
      <Sk className="mb-2 ml-4 h-3 w-16 rounded" />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass-border">
            <th className="w-full whitespace-nowrap px-4 py-2 text-left"><Sk className="h-3 w-10 rounded" /></th>
            <th className="hidden whitespace-nowrap px-4 py-2 sm:table-cell"><Sk className="h-3 w-20 rounded" /></th>
            <th className="hidden whitespace-nowrap px-4 py-2 md:table-cell"><Sk className="h-3 w-14 rounded" /></th>
            <th className="whitespace-nowrap px-4 py-2 text-right"><Sk className="ml-auto h-3 w-24 rounded" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-glass-border/60">
              <td className="w-full px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Sk className="h-6 w-6 shrink-0 rounded" />
                  <Sk className="h-3.5 w-28 rounded" />
                  <Sk className="h-3 w-8 rounded" />
                </div>
              </td>
              <td className="hidden px-4 py-2.5 sm:table-cell">
                <Sk className="h-4 w-14 rounded-full" />
              </td>
              <td className="hidden px-4 py-2.5 md:table-cell">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Sk key={j} className="h-5 w-5 rounded-full ring-1 ring-bg" />
                    ))}
                  </div>
                  <Sk className="h-3 w-4 rounded" />
                </div>
              </td>
              <td className="px-4 py-2.5 text-right">
                <Sk className="ml-auto h-4 w-6 rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Settings → Admin → Teams table
────────────────────────────────────────────────────────────────── */
function TeamsSettingsSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-glass-border bg-surface/20">
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
            {["Name", "Visibility", "Members", "Issues", "Created"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left">
                <Sk className="h-3 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-t border-glass-border">
              <td className="px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Sk className="h-5 w-5 shrink-0 rounded" />
                  <Sk className="h-3.5 w-24 rounded" />
                  <Sk className="h-3 w-8 rounded" />
                </div>
              </td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-20 rounded" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-8 rounded" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-8 rounded" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-16 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Settings → Admin → Members table
────────────────────────────────────────────────────────────────── */
function MembersSettingsSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-glass-border bg-surface/30">
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <Sk className="h-3 w-14 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-t border-glass-border">
              <td className="px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Sk className="h-7 w-7 shrink-0 rounded-full" />
                  <div className="space-y-1">
                    <Sk className="h-3.5 w-24 rounded" />
                    <Sk className="h-3 w-32 rounded" />
                  </div>
                </div>
              </td>
              <td className="px-5 py-2.5"><Sk className="h-5 w-14 rounded-full" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-20 rounded" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-16 rounded" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-16 rounded" /></td>
              <td className="px-5 py-2.5"><Sk className="h-3.5 w-16 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Labels table (shared: IssueLabelsPage + ProjectLabelsPage)
   Used as inline <tr> rows inside an existing <tbody>
────────────────────────────────────────────────────────────────── */
export function LabelSkeletonRows({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-t border-glass-border">
          <td className="py-3 pl-5 pr-3">
            <div className="flex items-center gap-2.5">
              <Sk className="h-3 w-3 shrink-0 rounded-full" />
              <Sk className="h-3.5 w-24 rounded" />
            </div>
          </td>
          <td className="py-3 px-3 text-right">
            <Sk className="ml-auto h-3.5 w-6 rounded" />
          </td>
          <td className="py-3 pl-3 pr-5">
            <div className="flex justify-end gap-1">
              <Sk className="h-6 w-6 rounded" />
              <Sk className="h-6 w-6 rounded" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Project detail card
────────────────────────────────────────────────────────────────── */
function ProjectDetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      {/* Header card */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Sk className="h-6 w-6 shrink-0 rounded" />
              <Sk className="h-5 w-48 rounded" />
            </div>
            <Sk className="h-4 w-full rounded" />
            <Sk className="h-4 w-4/5 rounded" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Sk className="h-8 w-8 rounded-md" />
            <Sk className="h-8 w-8 rounded-md" />
          </div>
        </div>

        {/* Properties */}
        <div className="mt-5 divide-y divide-glass-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Sk className="h-4 w-20 shrink-0 rounded" />
              <Sk className="h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Issues section */}
      <div className="glass rounded-xl p-5">
        <Sk className="mb-4 h-4 w-24 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-glass-border px-3 py-2.5">
              <Sk className="h-4 w-4 shrink-0 rounded-full" />
              <Sk className="h-3 w-10 shrink-0 rounded" />
              <Sk className="h-3 flex-1 rounded" />
              <Sk className="h-5 w-5 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Skeleton registry + wrapper
────────────────────────────────────────────────────────────────── */
const SKELETONS = {
  "issue-board":         IssueBoardSkeleton,
  "project-board":       ProjectBoardSkeleton,
  "issue-detail":        IssueDetailSkeleton,
  "members-list":        MembersListSkeleton,
  "teams-list":          TeamsListSkeleton,
  "teams-settings":      TeamsSettingsSkeleton,
  "members-settings":    MembersSettingsSkeleton,
  "project-detail":      ProjectDetailSkeleton,
};

/**
 * Wrapper component. When loading=true renders the named skeleton;
 * otherwise renders children transparently.
 *
 *   <Skeleton name="issue-board" loading={loading && issues.length === 0}>
 *     <IssueBoard ... />
 *   </Skeleton>
 */
export function Skeleton({ name, loading, children }) {
  if (!loading) return children;
  const Component = SKELETONS[name];
  return Component ? <Component /> : null;
}

// Also export individual skeletons for cases that need a direct import
// (e.g. early-return patterns in class components or complex conditionals)
export { IssueDetailSkeleton };
