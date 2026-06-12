import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import FormError from "../ui/FormError.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

export default function CreateWorkspaceModal({ open, onClose, onCreated }) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ws = await createWorkspace(name.trim());
      reset();
      onCreated?.(ws);
      onClose?.();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create workspace"
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-3" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="!w-auto px-4"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!name.trim()}
          >
            Create workspace
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <Input
          id="workspace-name"
          label="Workspace name"
          placeholder="Acme Inc."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <p className="text-xs text-fg-subtle">
          A workspace is where your team's projects and issues live.
        </p>
      </form>
    </Modal>
  );
}
