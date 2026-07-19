import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Send, CornerDownRight, Box, ImagePlus, X, Loader2, GitPullRequest, Github } from "lucide-react";
import FormError from "../ui/FormError.jsx";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import Popover from "../ui/Popover.jsx";
import PillButton from "../ui/PillButton.jsx";
import ImageLightbox from "../ui/ImageLightbox.jsx";
import { EnumPicker, UserPicker, LabelPicker } from "../pickers/Pickers.jsx";
import { ISSUE_STATUSES, ISSUE_STATUS_ORDER } from "../../constants/issueStatus.js";
import { PRIORITIES, PRIORITY_ORDER } from "../../constants/priority.js";
import {
  useGetIssueQuery,
  useGetTeamMembersQuery,
  useGetWorkspaceLabelsQuery,
  useGetTeamProjectsQuery,
  useUpdateIssueMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useCreateSubIssueMutation,
  useCreateLabelMutation,
  errMsg,
} from "../../redux/apiSlice.js";
import { issueService } from "../../services/issueService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { IssueDetailSkeleton } from "../ui/Skeleton.jsx";

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units = [["y", 31536000], ["mo", 2592000], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [label, sec] of units) {
    const v = Math.floor(s / sec);
    if (v >= 1) return `${v}${label} ago`;
  }
  return "just now";
};

// Full, editable issue view. Used by the issue page AND the inbox detail pane.
export default function IssueDetailView({ issueId }) {
  const { user } = useAuth();
  const { data: issue, isLoading, error, refetch } = useGetIssueQuery(issueId, { skip: !issueId });
  const teamId = issue?.teamId;
  const workspaceId = issue?.workspaceId;
  const projectId = issue?.project?.id || null;

  const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
  const { data: labels = [] } = useGetWorkspaceLabelsQuery(workspaceId, { skip: !workspaceId });
  const { data: projects = [] } = useGetTeamProjectsQuery(teamId, { skip: !teamId });

  const [updateIssue] = useUpdateIssueMutation();
  const [addCommentMut] = useAddCommentMutation();
  const [deleteCommentMut] = useDeleteCommentMutation();
  const [createSubIssueMut] = useCreateSubIssueMutation();
  const [createLabelMut] = useCreateLabelMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || "");
    }
  }, [issue]);

  const patch = (data) =>
    updateIssue({ id: issueId, teamId, projectId, ...data })
      .unwrap()
      .catch((e) => setLocalError(errMsg(e)));

  const createLabel = (name) => createLabelMut({ workspaceId, name }).unwrap();

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const batch = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...batch]);
    try {
      await issueService.uploadImages(issueId, files);
      await refetch();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setPendingImages((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
      batch.forEach((b) => URL.revokeObjectURL(b.url));
    }
  };

  const removeImage = async (url) => {
    try {
      await issueService.removeImage(issueId, url);
      refetch();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const submitComment = async (body, mentionIds) => {
    try {
      await addCommentMut({ issueId, body, mentionIds }).unwrap();
    } catch (e) {
      setLocalError(errMsg(e));
    }
  };

  const addSubIssue = async () => {
    if (!subTitle.trim()) return;
    try {
      await createSubIssueMut({ parentId: issueId, teamId, title: subTitle.trim() }).unwrap();
      setSubTitle("");
      setAddingSub(false);
    } catch (e) {
      setLocalError(errMsg(e));
    }
  };

  if (isLoading) {
    return <IssueDetailSkeleton />;
  }
  if (!issue) {
    return (
      <p className="py-10 text-center text-sm text-fg-muted">
        {error ? errMsg(error) : "Issue not found"}
      </p>
    );
  }

  return (
    <>
      <FormError message={localError} />
      <div className="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6 lg:px-10">
          <div className="mx-auto max-w-3xl">
            {issue.parent && (
              <Link
                to={`/issues/${issue.parent.id}`}
                className="mb-3 inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
              >
                <CornerDownRight className="h-3.5 w-3.5" />
                {issue.parent.identifier} · {issue.parent.title}
              </Link>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== issue.title && patch({ title })}
              className="w-full bg-transparent text-2xl font-semibold tracking-tight text-fg placeholder:text-fg-subtle focus:outline-none"
              placeholder="Issue title"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (issue.description || "") && patch({ description })}
              placeholder="Add a description…"
              rows={Math.max(4, description.split("\n").length + 1)}
              className="mt-4 w-full resize-none bg-transparent text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
            />

            <div className="mt-4">
              {(issue.images?.length > 0 || pendingImages.length > 0) && (
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {issue.images?.map((url) => (
                    <div key={url} className="group relative overflow-hidden rounded-lg border border-glass-border">
                      <img
                        src={url}
                        alt="attachment"
                        onClick={() => setLightbox(url)}
                        className="h-36 w-full cursor-zoom-in object-cover"
                      />
                      <button
                        onClick={() => removeImage(url)}
                        className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {pendingImages.map((p) => (
                    <div key={p.id} className="relative overflow-hidden rounded-lg border border-glass-border">
                      <img src={p.url} alt="uploading" className="h-36 w-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
                <ImagePlus className="h-3.5 w-3.5" />
                Attach image
                <input type="file" accept="image/*" multiple hidden onChange={onPickImages} />
              </label>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-fg">Sub-issues</h3>
                <button
                  onClick={() => setAddingSub((s) => !s)}
                  className="rounded p-1 text-fg-muted hover:bg-surface-hover hover:text-fg"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {issue.children.map((c) => {
                  const meta = ISSUE_STATUSES[c.status] || ISSUE_STATUSES.TODO;
                  const I = meta.icon;
                  return (
                    <Link
                      key={c.id}
                      to={`/issues/${c.id}`}
                      className="flex items-center gap-2 rounded-md border border-glass-border px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                    >
                      <I className="h-3.5 w-3.5" style={{ color: meta.color }} />
                      <span className="text-xs text-fg-subtle">{c.identifier}</span>
                      <span className="flex-1 truncate text-fg">{c.title}</span>
                      {c.assignee && <Avatar name={c.assignee.name} src={c.assignee.avatarUrl} size="sm" />}
                    </Link>
                  );
                })}
                {addingSub && (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSubIssue()}
                      placeholder="Sub-issue title"
                      className="h-9 flex-1 rounded-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none"
                    />
                    <Button className="!w-auto px-3" onClick={addSubIssue}>Add</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10">
              <h3 className="mb-3 text-sm font-medium text-fg">Activity</h3>
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <Avatar name={issue.createdBy?.name || "?"} src={issue.createdBy?.avatarUrl} size="md" />
                <span className="text-fg">{issue.createdBy?.name || "Someone"}</span>
                created this issue · {timeAgo(issue.createdAt)}
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {issue.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.author.name} src={c.author.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-fg">{c.author.name}</span>
                        <span className="text-xs text-fg-subtle">{timeAgo(c.createdAt)}</span>
                        {c.author.id === user?.id && (
                          <button
                            onClick={() => deleteCommentMut({ commentId: c.id, issueId })}
                            className="ml-auto text-xs text-fg-subtle hover:text-danger"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg-muted">
                        {highlightMentions(c.body, members)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <CommentComposer
                members={members}
                currentUserId={user?.id}
                onSubmit={submitComment}
              />
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-glass-border p-5 lg:w-72 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <Section title="Properties">
            <div className="flex flex-col items-start gap-2">
              <EnumPicker value={issue.status} onChange={(v) => patch({ status: v })} map={ISSUE_STATUSES} order={ISSUE_STATUS_ORDER} fallback="TODO" />
              <EnumPicker value={issue.priority} onChange={(v) => patch({ priority: v })} map={PRIORITIES} order={PRIORITY_ORDER} fallback="NONE" />
              <UserPicker value={issue.assignee?.id || null} onChange={(v) => patch({ assigneeId: v })} users={members} label="Assignee" />
            </div>
          </Section>

          <Section title="Labels">
            <div className="flex flex-wrap items-center gap-1.5">
              {issue.labels.map((l) => (
                <span key={l.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name}
                </span>
              ))}
              <LabelPicker
                value={issue.labels.map((l) => l.id)}
                onChange={(ids) => patch({ labelIds: ids })}
                labels={labels}
                onCreateLabel={createLabel}
              />
            </div>
          </Section>

          <Section title="Project">
            <ProjectPicker
              value={issue.project?.id || null}
              projects={projects}
              onChange={(v) => patch({ projectId: v })}
            />
          </Section>

          {issue.project?.repoFullName && (
            <Section title="Repository">
              <a
                href={`https://github.com/${issue.project.repoFullName}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-fg hover:underline"
              >
                <Github className="h-3.5 w-3.5" />
                {issue.project.repoFullName}
              </a>
            </Section>
          )}

          <Section title="Pull requests">
            <PullRequests issueId={issue.id} prs={issue.pullRequests || []} onChanged={refetch} />
          </Section>
        </aside>
      </div>

      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Render text with @mentions (of the given members) coloured like Linear.
function highlightMentions(body, members = []) {
  const names = members.map((m) => m.name).filter(Boolean);
  if (!names.length) return body;
  const re = new RegExp(`(@(?:${names.map(escapeRegExp).join("|")}))`, "g");
  const set = new Set(names.map((n) => `@${n}`));
  return body.split(re).map((part, i) =>
    set.has(part) ? (
      <span key={i} className="font-medium text-brand">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Comment box with @mention autocomplete + blue mention highlighting.
function CommentComposer({ members, currentUserId, onSubmit }) {
  const [text, setText] = useState("");
  const [mentioned, setMentioned] = useState([]); // { id, name } the user picked
  const [menu, setMenu] = useState(null); // { query, start } | null
  const ref = useRef(null);

  // Members the user can mention — never themselves.
  const mentionable = members.filter((m) => m.id !== currentUserId);

  const detectMention = (value, caret) => {
    const before = value.slice(0, caret);
    const m = before.match(/(^|\s)@([\w.-]*)$/);
    if (!m) return null;
    return { query: m[2], start: caret - m[2].length - 1 }; // index of the '@'
  };

  const onChange = (e) => {
    setText(e.target.value);
    setMenu(detectMention(e.target.value, e.target.selectionStart));
  };

  const pick = (member) => {
    if (!menu || !ref.current) return;
    const caret = ref.current.selectionStart;
    const before = text.slice(0, menu.start);
    const after = text.slice(caret);
    const insert = `@${member.name} `;
    const next = before + insert + after;
    setText(next);
    setMentioned((prev) => (prev.some((p) => p.id === member.id) ? prev : [...prev, member]));
    setMenu(null);
    requestAnimationFrame(() => {
      const pos = (before + insert).length;
      ref.current.focus();
      ref.current.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    if (!text.trim()) return;
    const ids = [
      ...new Set(mentioned.filter((m) => text.includes(`@${m.name}`)).map((m) => m.id)),
    ];
    onSubmit(text.trim(), ids);
    setText("");
    setMentioned([]);
    setMenu(null);
  };

  const filtered = menu
    ? mentionable
        .filter((m) => m.name.toLowerCase().includes(menu.query.toLowerCase()))
        .slice(0, 6)
    : [];

  // Only highlight names the user actually selected (and still present).
  const activeMentions = mentioned.filter((m) => text.includes(`@${m.name}`));

  return (
    <div className="relative mt-4">
      {menu && filtered.length > 0 && (
        <div className="glass-strong absolute bottom-full left-0 z-20 mb-1 w-64 rounded-lg p-1">
          {filtered.map((m) => (
            <button
              key={m.id}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-hover"
            >
              <Avatar name={m.name} src={m.avatarUrl} size="sm" />
              <span className="truncate text-fg">{m.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-lg border border-glass-border p-2">
        <div className="relative flex-1">
          {/* Highlight overlay (mirrors the textarea, colours mentions blue) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-sm leading-relaxed text-fg"
          >
            {highlightMentions(text, activeMentions)}
            {"​"}
          </div>
          <textarea
            ref={ref}
            value={text}
            onChange={onChange}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMenu(null);
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={2}
            placeholder="Leave a comment… (@ to mention)"
            style={{ caretColor: "var(--fg)" }}
            className="relative w-full resize-none bg-transparent text-sm leading-relaxed text-transparent placeholder:text-fg-subtle focus:outline-none"
          />
        </div>
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="rounded-md bg-brand p-2 text-brand-fg disabled:opacity-50"
          title="Comment (Ctrl+Enter)"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5 border-b border-glass-border pb-5 last:border-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</p>
      {children}
    </div>
  );
}

const PR_STATE_COLOR = {
  open: "text-success",
  merged: "text-brand",
  closed: "text-danger",
};

function PullRequests({ issueId, prs, onChanged }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const link = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await issueService.linkPr(issueId, url.trim());
      setUrl("");
      onChanged?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await issueService.unlinkPr(id).catch(() => {});
    onChanged?.();
  };

  return (
    <div className="flex flex-col gap-2">
      {prs.length === 0 && <p className="text-xs text-fg-subtle">No linked pull requests</p>}
      {prs.map((pr) => (
        <div key={pr.id} className="flex items-center gap-2 text-sm">
          <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-fg hover:underline"
          >
            {pr.title || pr.url}
          </a>
          <span className={`text-[11px] capitalize ${PR_STATE_COLOR[pr.state] || "text-fg-subtle"}`}>
            {pr.state}
          </span>
          <button onClick={() => remove(pr.id)} className="text-fg-subtle hover:text-danger" aria-label="Remove link">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {err && <p className="text-xs text-danger">{err}</p>}
      <div className="flex items-center gap-1.5">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste GitHub PR URL"
          className="h-8 flex-1 rounded-md border border-input-border bg-input px-2 text-xs text-fg focus:outline-none"
        />
        <button
          onClick={link}
          disabled={busy}
          className="rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:bg-surface-hover hover:text-fg disabled:opacity-60"
        >
          Link
        </button>
      </div>
    </div>
  );
}

function ProjectPicker({ value, projects, onChange }) {
  const selected = projects.find((p) => p.id === value);
  return (
    <Popover
      trigger={({ toggle }) => (
        <PillButton onClick={toggle} active={!!selected}>
          {selected ? (
            <>
              {selected.icon ? (
                <span aria-hidden="true">{selected.icon}</span>
              ) : (
                <Box className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            "No project"
          )}
        </PillButton>
      )}
    >
      {({ close }) => (
        <div className="max-h-64 w-56 overflow-y-auto">
          <button
            onClick={() => { onChange(null); close(); }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg-muted hover:bg-surface-hover"
          >
            No project
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-hover"
            >
              {p.icon ? (
                <span aria-hidden="true">{p.icon}</span>
              ) : (
                <Box className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
