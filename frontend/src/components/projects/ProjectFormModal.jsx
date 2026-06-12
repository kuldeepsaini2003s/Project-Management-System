import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import FormError from "../ui/FormError.jsx";
import { STATUS_ORDER, PROJECT_STATUSES } from "../../constants/projectStatus.js";

const EMPTY = {
  name: "",
  description: "",
  icon: "",
  color: "#5e6ad2",
  status: "BACKLOG",
  targetDate: "",
};

const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export default function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  mode = "create",
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name || "",
              description: initial.description || "",
              icon: initial.icon || "",
              color: initial.color || "#5e6ad2",
              status: initial.status || "BACKLOG",
              targetDate: toInputDate(initial.targetDate),
            }
          : EMPTY
      );
      setError("");
      setLoading(false);
    }
  }, [open, initial]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        targetDate: form.targetDate || null,
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
      title={mode === "create" ? "New project" : "Edit project"}
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-3" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="!w-auto px-4"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!form.name.trim()}
          >
            {mode === "create" ? "Create project" : "Save changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />

        <div className="flex gap-3">
          <div className="w-16">
            <Input
              id="project-icon"
              label="Icon"
              placeholder="📦"
              maxLength={2}
              value={form.icon}
              onChange={set("icon")}
              className="text-center text-lg"
            />
          </div>
          <div className="flex-1">
            <Input
              id="project-name"
              label="Name"
              placeholder="Mobile App"
              value={form.name}
              onChange={set("name")}
              autoFocus
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-desc" className="text-sm font-medium text-fg-muted">
            Description
          </label>
          <textarea
            id="project-desc"
            rows={3}
            placeholder="What is this project about?"
            value={form.description}
            onChange={set("description")}
            className="w-full resize-none rounded-md border border-input-border bg-input px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-status" className="text-sm font-medium text-fg-muted">
              Status
            </label>
            <select
              id="project-status"
              value={form.status}
              onChange={set("status")}
              className="h-10 rounded-md border border-input-border bg-input px-2.5 text-sm text-fg focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUSES[s].label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="project-date"
            type="date"
            label="Target date"
            value={form.targetDate}
            onChange={set("targetDate")}
          />
        </div>
      </form>
    </Modal>
  );
}
