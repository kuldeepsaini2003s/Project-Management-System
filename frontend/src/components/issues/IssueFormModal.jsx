import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import FormError from "../ui/FormError.jsx";
import { EnumPicker, UserPicker, LabelPicker, DependencyPicker } from "../pickers/Pickers.jsx";
import { ISSUE_STATUSES, ISSUE_STATUS_ORDER } from "../../constants/issueStatus.js";
import { PRIORITIES, PRIORITY_ORDER } from "../../constants/priority.js";
import { useCreateLabelMutation } from "../../store/apiSlice.js";

const EMPTY = {
  title: "",
  description: "",
  status: "TODO",
  priority: "NONE",
  assigneeId: null,
  projectId: null,
  labelIds: [],
};

export default function IssueFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  mode = "create",
  teamId,
  teamKey = "TEAM",
  members = [],
  labels = [],
  projects = [],
  lockedProjectId,
  defaultStatus,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createLabelMut] = useCreateLabelMutation();
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoading(false);
    setForm(
      initial
        ? {
            title: initial.title || "",
            description: initial.description || "",
            status: initial.status || "TODO",
            priority: initial.priority || "NONE",
            assigneeId: initial.assignee?.id || initial.assigneeId || null,
            projectId: initial.project?.id || initial.projectId || lockedProjectId || null,
            labelIds: (initial.labels || []).map((l) => l.id),
          }
        : { ...EMPTY, status: defaultStatus || "TODO", projectId: lockedProjectId || null }
    );
  }, [open, initial, lockedProjectId, defaultStatus]);

  const createLabel = (name) => createLabelMut({ teamId, name }).unwrap();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(form);
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
      size="lg"
      title={
        <span className="flex items-center gap-1.5 text-sm">
          <span className="rounded bg-brand/15 px-1.5 py-0.5 text-xs font-semibold text-brand">
            {teamKey}
          </span>
          <span className="text-fg-subtle">›</span>
          <span className="text-fg">{mode === "create" ? "New issue" : initial?.identifier}</span>
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
            disabled={!form.title.trim()}
          >
            {mode === "create" ? "Create issue" : "Save changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormError message={error} />

        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Issue title"
          autoFocus
          className="w-full bg-transparent text-lg font-medium text-fg placeholder:text-fg-subtle focus:outline-none"
        />
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="Add description…"
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
        />

        <div className="flex flex-wrap gap-1.5 border-t border-glass-border pt-3">
          <EnumPicker
            value={form.status}
            onChange={(v) => set("status", v)}
            map={ISSUE_STATUSES}
            order={ISSUE_STATUS_ORDER}
            fallback="TODO"
          />
          <EnumPicker
            value={form.priority}
            onChange={(v) => set("priority", v)}
            map={PRIORITIES}
            order={PRIORITY_ORDER}
            fallback="NONE"
          />
          <UserPicker
            value={form.assigneeId}
            onChange={(v) => set("assigneeId", v)}
            users={members}
            label="Assignee"
          />
          {!lockedProjectId && (
            <DependencyPicker
              value={form.projectId ? [form.projectId] : []}
              onChange={(ids) => set("projectId", ids[ids.length - 1] || null)}
              projects={projects}
            />
          )}
          <LabelPicker
            value={form.labelIds}
            onChange={(v) => set("labelIds", v)}
            labels={labels}
            onCreateLabel={createLabel}
          />
        </div>
      </form>
    </Modal>
  );
}
