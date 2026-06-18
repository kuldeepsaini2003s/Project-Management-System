import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowUp, ArrowDown } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { useGetWorkspaceMembersQuery } from "../redux/apiSlice.js";

const ROLE_LABEL = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

const fmtJoined = (v) =>
  v ? new Date(v).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";

const lastSeen = (v) => {
  if (!v) return { text: "—", online: false };
  const diff = Date.now() - new Date(v).getTime();
  if (diff < 2 * 60 * 1000) return { text: "Online", online: true };
  const m = Math.floor(diff / 60000);
  if (m < 60) return { text: `${m}m ago`, online: false };
  const h = Math.floor(m / 60);
  if (h < 24) return { text: `${h}h ago`, online: false };
  const d = Math.floor(h / 24);
  if (d < 30) return { text: `${d}d ago`, online: false };
  return { text: new Date(v).toLocaleDateString(undefined, { month: "short", year: "numeric" }), online: false };
};

const th = "whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-fg-subtle";
const td = "whitespace-nowrap px-4 py-2.5";

export default function WorkspaceMembersPage() {
  const { onMenu } = useOutletContext() || {};
  const { currentId } = useWorkspace();
  const { data: members = [], isLoading } = useGetWorkspaceMembersQuery(currentId, {
    skip: !currentId,
  });
  const [dir, setDir] = useState("asc");

  const sorted = useMemo(() => {
    const list = [...members].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (dir === "desc") list.reverse();
    return list;
  }, [members, dir]);

  const toggleSort = () => setDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={[`Members${members.length ? ` · ${members.length}` : ""}`]} onMenu={onMenu} />

      <div className="glass min-h-0 flex-1 overflow-auto rounded-lg p-4 sm:p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border">
              <th className={`${th} w-full`}>
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-fg">
                  Name
                  {dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                </button>
              </th>
              <th className={`${th} hidden sm:table-cell`}>Status</th>
              <th className={`${th} hidden md:table-cell`}>Joined</th>
              <th className={`${th} hidden lg:table-cell`}>Teams</th>
              <th className={`${th} text-right`}>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-fg-muted">
                  Loading…
                </td>
              </tr>
            ) : (
              sorted.map((m) => {
                const seen = lastSeen(m.lastSeenAt);
                return (
                  <tr key={m.id} className="border-b border-glass-border/60 hover:bg-surface-hover">
                    <td className={`${td} w-full`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={m.name} src={m.avatarUrl} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">{m.name}</p>
                          <p className="truncate text-xs text-fg-subtle">{m.email?.split("@")[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} hidden sm:table-cell`}>
                      <span className="rounded bg-surface-hover px-2 py-0.5 text-xs text-fg-muted">
                        {ROLE_LABEL[m.role] || m.role}
                      </span>
                    </td>
                    <td className={`${td} hidden text-fg-muted md:table-cell`}>{fmtJoined(m.joinedAt)}</td>
                    <td className={`${td} hidden lg:table-cell`}>
                      <span className="flex flex-wrap gap-1">
                        {(m.teams || []).map((k) => (
                          <span
                            key={k}
                            className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[11px] text-fg-muted"
                          >
                            {k}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className={`${td} text-right ${seen.online ? "text-success" : "text-fg-subtle"}`}>
                      {seen.online && (
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-success align-middle" />
                      )}
                      {seen.text}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
