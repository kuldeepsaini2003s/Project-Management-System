import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import FormError from "../ui/FormError.jsx";
import {
  EnumPicker,
  UserPicker,
  MembersPicker,
  DatePicker,
  LabelPicker,
  DependencyPicker,
} from "../pickers/Pickers.jsx";
import { PROJECT_STATUSES, STATUS_ORDER } from "../../constants/projectStatus.js";
import { PRIORITIES, PRIORITY_ORDER } from "../../constants/priority.js";
import {
  useGetTeamMembersQuery,
  useGetWorkspaceLabelsQuery,
  useGetTeamProjectsQuery,
  useCreateLabelMutation,
} from "../../redux/apiSlice.js";

const EMPTY = {
  name: "",
  summary: "",
  description: "",
  icon: "",
  status: "BACKLOG",
  priority: "NONE",
  leadId: null,
  memberIds: [],
  labelIds: [],
  dependsOnIds: [],
  startDate: null,
  targetDate: null,
  milestones: [],
};

const toInputDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : null);

export default function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  mode = "create",
  teamId,
  teamKey = "TEAM",
  workspaceId,
  teams = [], // when no fixed teamId, let the user pick a team
  defaultStatus,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState(teamId || null);

  // The workspace owning the selected team (labels are workspace-scoped).
  const activeWorkspaceId =
    workspaceId || teams.find((t) => t.id === activeTeamId)?.workspaceId;

  // Cached picker data.
  const skip = { skip: !open || !activeTeamId };
  const { data: members = [] } = useGetTeamMembersQuery(activeTeamId, skip);
  const { data: labels = [] } = useGetWorkspaceLabelsQuery(activeWorkspaceId, {
    skip: !open || !activeWorkspaceId,
  });
  const { data: allProjects = [] } = useGetTeamProjectsQuery(activeTeamId, skip);
  const [createLabelMut] = useCreateLabelMutation();

  const projects = allProjects.filter((p) => p.id !== initial?.id);
  const activeKey =
    teams.find((t) => t.id === activeTeamId)?.key || (teamId ? teamKey : "TEAM");
  const needTeamPick = !teamId && teams.length > 0;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoading(false);
    setActiveTeamId(teamId || initial?.teamId || teams[0]?.id || null);
    setForm(
      initial
        ? {
            ...EMPTY,
            ...initial,
            leadId: initial.lead?.id || initial.leadId || null,
            memberIds: (initial.members || []).map((m) => m.id),
            labelIds: (initial.labels || []).map((l) => l.id),
            dependsOnIds: (initial.dependsOn || []).map((d) => d.id),
            startDate: toInputDate(initial.startDate),
            targetDate: toInputDate(initial.targetDate),
            milestones: (initial.milestones || []).map((m) => ({
              name: m.name,
              targetDate: toInputDate(m.targetDate),
            })),
          }
        : { ...EMPTY, status: defaultStatus || "BACKLOG" }
    );
  }, [open, initial, teamId, defaultStatus]);

  const createLabel = (name) => createLabelMut({ workspaceId: activeWorkspaceId, name }).unwrap();

  const addMilestone = () =>
    set("milestones", [...form.milestones, { name: "", targetDate: null }]);
  const updateMilestone = (i, patch) =>
    set(
      "milestones",
      form.milestones.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
    );
  const removeMilestone = (i) =>
    set("milestones", form.milestones.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        teamId: activeTeamId,
        milestones: form.milestones.filter((m) => m.name.trim()),
      });
      onClose?.();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="2xl"
      title={
        <span className="flex items-center gap-1.5 text-sm">
          <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs font-semibold text-brand">
            {activeKey}
          </span>
          <span className="text-fg-subtle">›</span>
          <span className="text-fg">{mode === "create" ? "New project" : "Edit project"}</span>
        </span>
      }
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-3" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="!w-auto px-4"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!form.name.trim() || !activeTeamId}
          >
            {mode === "create" ? "Create project" : "Save changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />

        {needTeamPick && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-muted">Team</span>
            <select
              value={activeTeamId || ""}
              onChange={(e) => setActiveTeamId(e.target.value)}
              className="h-9 rounded-md border border-input-border bg-input px-2.5 text-sm text-fg focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Icon (own row) + name + summary */}
        <div>
          <input
            value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            maxLength={2}
            placeholder="📦"
            aria-label="Project icon"
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-center text-xl focus:outline-none"
          />
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Project name"
            autoFocus
            className="w-full bg-transparent text-2xl font-semibold tracking-tight text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <input
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="Add a short summary…"
            className="mt-2 w-full bg-transparent text-sm text-fg-muted placeholder:text-fg-subtle focus:outline-none"
          />
        </div>

        {/* Property pills */}
        <div className="flex flex-wrap gap-1.5">
          <EnumPicker
            value={form.status}
            onChange={(v) => set("status", v)}
            map={PROJECT_STATUSES}
            order={STATUS_ORDER}
            fallback="BACKLOG"
          />
          <EnumPicker
            value={form.priority}
            onChange={(v) => set("priority", v)}
            map={PRIORITIES}
            order={PRIORITY_ORDER}
            fallback="NONE"
          />
          <UserPicker value={form.leadId} onChange={(v) => set("leadId", v)} users={members} label="Lead" />
          <MembersPicker value={form.memberIds} onChange={(v) => set("memberIds", v)} users={members} />
          <DatePicker value={form.startDate} onChange={(v) => set("startDate", v)} label="Start" />
          <DatePicker value={form.targetDate} onChange={(v) => set("targetDate", v)} label="Target" />
          <LabelPicker
            value={form.labelIds}
            onChange={(v) => set("labelIds", v)}
            labels={labels}
            onCreateLabel={createLabel}
          />
          <DependencyPicker
            value={form.dependsOnIds}
            onChange={(v) => set("dependsOnIds", v)}
            projects={projects}
          />
        </div>

        <div className="h-px bg-glass-border" />

        {/* Description */}
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={10}
          placeholder="Write a description, a project brief, or collect ideas…"
          className="min-h-[300px] w-full resize-none bg-transparent text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
        />

        {/* Milestones — full-width bar */}
        <div className="border-t border-glass-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">Milestones</span>
            <button
              type="button"
              onClick={addMilestone}
              aria-label="Add milestone"
              className="rounded p-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {form.milestones.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {form.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={m.name}
                    onChange={(e) => updateMilestone(i, { name: e.target.value })}
                    placeholder="Milestone name"
                    className="h-8 flex-1 rounded-md border border-input-border bg-input px-2 text-sm text-fg focus:outline-none"
                  />
                  <input
                    type="date"
                    value={m.targetDate || ""}
                    onChange={(e) => updateMilestone(i, { targetDate: e.target.value || null })}
                    className="h-8 rounded-md border border-input-border bg-input px-2 text-sm text-fg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="rounded p-1.5 text-fg-subtle hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
