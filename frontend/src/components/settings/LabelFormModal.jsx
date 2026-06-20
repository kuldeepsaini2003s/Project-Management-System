import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";

const PRESET_COLORS = [
  "#e05252", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#06b6d4", "#6366f1", "#7c5cdd", "#84cc16",
];

export default function LabelFormModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [color, setColor] = useState(initial?.color || "#6366f1");
  const [description, setDescription] = useState(initial?.description || "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, description });
    setName(""); setColor("#6366f1"); setDescription("");
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit label" : "New label"}
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-4" onClick={onClose}>Cancel</Button>
          <Button className="!w-auto px-4" onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Color + Name row */}
        <div className="flex items-center gap-3">
          <div
            className="h-5 w-5 shrink-0 rounded-full border-2 border-border-strong cursor-pointer"
            style={{ backgroundColor: color }}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Label name"
            className="h-9 flex-1 rounded-md border border-input-border bg-input px-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            autoFocus
          />
        </div>

        {/* Color swatches */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-brand ring-offset-2 ring-offset-bg" : ""}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>

        {/* Description */}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
    </Modal>
  );
}
