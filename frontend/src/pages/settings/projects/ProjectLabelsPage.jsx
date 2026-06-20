import { useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import {
  useGetWorkspaceLabelsQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
} from "../../../redux/apiSlice.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import LabelFormModal from "../../../components/settings/LabelFormModal.jsx";

export default function ProjectLabelsPage() {
  const { currentId } = useWorkspace();
  const { data: labels = [], isLoading } = useGetWorkspaceLabelsQuery(currentId, { skip: !currentId });
  const [createLabel] = useCreateLabelMutation();
  const [updateLabel] = useUpdateLabelMutation();
  const [deleteLabel] = useDeleteLabelMutation();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = labels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data) => {
    await createLabel({ workspaceId: currentId, ...data });
    setCreateOpen(false);
  };

  const handleUpdate = async (data) => {
    await updateLabel({ id: editing.id, workspaceId: currentId, ...data });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this label? It will be removed from all projects.")) return;
    await deleteLabel({ id, workspaceId: currentId });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <SettingsPageHeader title="Project labels" />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="h-8 w-full rounded-md border border-input-border bg-input pl-8 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="ml-auto">
          <Button className="!w-auto px-3 text-sm flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New label
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="py-3 pl-5 pr-3 text-left text-xs font-medium text-fg-muted">Name ↓</th>
              <th className="py-3 px-3 text-right text-xs font-medium text-fg-muted">Projects</th>
              <th className="py-3 pl-3 pr-5 text-right text-xs font-medium text-fg-muted"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {isLoading ? (
              <tr><td colSpan={3} className="py-10 text-center text-sm text-fg-muted">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="py-10 text-center text-sm text-fg-muted">
                {search ? "No labels match your search" : "No labels yet — create one above"}
              </td></tr>
            ) : (
              filtered.map((label) => (
                <tr key={label.id} className="hover:bg-surface-hover transition-colors group">
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                      <span className="font-medium text-fg">{label.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-fg-muted">{label.projectCount ?? 0}</td>
                  <td className="py-3 pl-3 pr-5">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(label)}
                        className="rounded p-1 text-fg-muted hover:text-fg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(label.id)}
                        className="rounded p-1 text-fg-muted hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LabelFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />
      <LabelFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleUpdate}
        initial={editing}
      />
    </div>
  );
}
