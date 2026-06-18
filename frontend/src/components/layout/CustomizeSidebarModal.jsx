import { useDispatch, useSelector } from "react-redux";
import Modal from "../ui/Modal.jsx";
import { setSidebarPref } from "../../redux/uiSlice.js";

function Row({ label, k, prefs, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-surface-hover">
      <span className="text-sm text-fg">{label}</span>
      <select
        value={prefs[k] ? "show" : "hide"}
        onChange={(e) => onChange(k, e.target.value === "show")}
        className="h-8 rounded-md border border-input-border bg-input px-2 text-xs text-fg focus:outline-none"
      >
        <option value="show">Always show</option>
        <option value="hide">Don&rsquo;t show</option>
      </select>
    </div>
  );
}

export default function CustomizeSidebarModal({ open, onClose }) {
  const dispatch = useDispatch();
  const prefs = useSelector((s) => s.ui.sidebarPrefs);
  const onChange = (key, value) => dispatch(setSidebarPref({ key, value }));

  return (
    <Modal open={open} onClose={onClose} size="md" title="Customize sidebar">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            Personal
          </p>
          <Row label="Inbox" k="inbox" prefs={prefs} onChange={onChange} />
          <Row label="My issues" k="myIssues" prefs={prefs} onChange={onChange} />
        </div>
        <div>
          <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            Workspace
          </p>
          <Row label="Projects" k="projects" prefs={prefs} onChange={onChange} />
          <Row label="Members" k="members" prefs={prefs} onChange={onChange} />
          <Row label="Teams" k="teams" prefs={prefs} onChange={onChange} />
        </div>
      </div>
    </Modal>
  );
}
