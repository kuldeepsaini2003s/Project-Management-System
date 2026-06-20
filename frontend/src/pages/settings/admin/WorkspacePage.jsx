import { useState, useEffect, useRef } from "react";
import { Check, Camera } from "lucide-react";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import { useUpdateWorkspaceMutation } from "../../../redux/apiSlice.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import Button from "../../../components/ui/Button.jsx";

export default function WorkspacePage() {
  const { current, refresh } = useWorkspace();
  const [updateWorkspace, { isLoading: saving }] = useUpdateWorkspaceMutation();
  const fileRef = useRef(null);

  const [name, setName] = useState(current?.name || "");
  const [logoPreview, setLogoPreview] = useState(current?.logoUrl || null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (current) {
      setName(current.name || "");
      setLogoPreview(current.logoUrl || null);
    }
  }, [current]);

  const nameDirty = name.trim() && name.trim() !== current?.name;

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setLogoPreview(dataUrl);
      await updateWorkspace({ id: current.id, logoUrl: dataUrl }).unwrap().catch(() => {});
      refresh();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!nameDirty) return;
    try {
      await updateWorkspace({ id: current.id, name: name.trim() }).unwrap();
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handled by RTK Query
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Workspace" />

      <div className="flex flex-col gap-4">
        <SettingsSection>
          {/* Logo */}
          <SettingsRow label="Logo" description="Click to change. Recommended size 256×256px.">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileRef.current?.click()}
              title="Click to change logo"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Workspace logo"
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/20 text-brand font-bold text-xl">
                  {name.slice(0, 2).toUpperCase() || "WS"}
                </div>
              )}
              <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </SettingsRow>

          {/* Name */}
          <SettingsRow label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Workspace name"
            />
          </SettingsRow>

          {/* URL */}
          <SettingsRow label="URL">
            <div className="flex items-center">
              <span className="flex h-8 items-center rounded-l-md border border-r-0 border-input-border bg-surface-hover px-2.5 text-sm text-fg-muted">
                app.linear.so/
              </span>
              <span className="flex h-8 items-center rounded-r-md border border-input-border bg-surface-hover px-3 text-sm text-fg-muted">
                {(current?.name || "workspace").toLowerCase().replace(/[^a-z0-9]/g, "-")}
              </span>
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* Save */}
        <div className="flex items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button
            className="!w-auto px-5"
            onClick={handleSaveName}
            isLoading={saving}
            disabled={!nameDirty}
          >
            Save changes
          </Button>
        </div>

        {/* Time & Region */}
        <SettingsSection title="Time &amp; region">
          <SettingsRow
            label="First month of the fiscal year"
            description="Used when grouping projects and issues quarterly, half-yearly, and yearly"
          >
            <select className="h-8 rounded-md border border-input-border bg-input px-2.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand">
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </SettingsRow>
          <SettingsRow label="Region" description="Set when a workspace is created and cannot be changed.">
            <span className="text-sm text-fg-muted">European Union</span>
          </SettingsRow>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          <SettingsRow label="Delete workspace" description="Schedule workspace to be permanently deleted">
            <Button variant="ghost" className="!w-auto px-3 text-sm !text-danger hover:!text-danger">
              Delete workspace
            </Button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
