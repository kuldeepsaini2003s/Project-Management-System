import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import FormError from "../ui/FormError.jsx";
import { useTeams } from "../../context/TeamContext.jsx";

const deriveKey = (name) =>
  (name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "").padEnd(0);

export default function CreateTeamModal({ open, onClose, onCreated }) {
  const { createTeam } = useTeams();
  const [form, setForm] = useState({ name: "", key: "", icon: "" });
  const [keyEdited, setKeyEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: "", key: "", icon: "" });
      setKeyEdited(false);
      setError("");
      setLoading(false);
    }
  }, [open]);

  const onName = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, key: keyEdited ? f.key : deriveKey(name) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const team = await createTeam({
        name: form.name.trim(),
        key: form.key.trim() || undefined,
        icon: form.icon || undefined,
      });
      onCreated?.(team);
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
      title="Create team"
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
            Create team
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <div className="flex gap-3">
          <div className="w-16">
            <Input
              id="team-icon"
              label="Icon"
              placeholder="⚡"
              maxLength={2}
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="text-center text-lg"
            />
          </div>
          <div className="flex-1">
            <Input
              id="team-name"
              label="Team name"
              placeholder="Engineering"
              value={form.name}
              onChange={onName}
              autoFocus
              required
            />
          </div>
        </div>
        <div className="w-32">
          <Input
            id="team-key"
            label="Identifier"
            placeholder="ENG"
            maxLength={6}
            value={form.key}
            onChange={(e) => {
              setKeyEdited(true);
              setForm((f) => ({ ...f, key: e.target.value.toUpperCase() }));
            }}
          />
        </div>
        <p className="text-xs text-fg-subtle">
          The identifier prefixes issue IDs, e.g. <span className="text-fg-muted">{form.key || "ENG"}-123</span>.
        </p>
      </form>
    </Modal>
  );
}
