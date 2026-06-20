import { useState } from "react";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import Button from "../../../components/ui/Button.jsx";

export default function WorkspacePage() {
  const { current } = useWorkspace();
  const [name, setName] = useState(current?.name || "Algofolks");
  const [url, setUrl] = useState("algofolks");

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Workspace" />

      <div className="flex flex-col gap-4">
        <SettingsSection>
          {/* Logo */}
          <SettingsRow label="Logo" description="Recommended size is 256×256px">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/20 text-brand font-bold text-lg cursor-pointer hover:bg-brand/30 transition-colors">
              {name.slice(0, 2).toUpperCase()}
            </div>
          </SettingsRow>

          {/* Name */}
          <SettingsRow label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </SettingsRow>

          {/* URL */}
          <SettingsRow label="URL">
            <div className="flex items-center gap-0">
              <span className="flex h-8 items-center rounded-l-md border border-r-0 border-input-border bg-surface-hover px-2.5 text-sm text-fg-muted">
                linear.app/
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-8 w-36 rounded-r-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* Save */}
        <div className="flex justify-end">
          <Button className="!w-auto px-5">Save changes</Button>
        </div>

        {/* Time & Region */}
        <SettingsSection title="Time &amp; region">
          <SettingsRow label="First month of the fiscal year" description="Used when grouping projects and issues quarterly, half-yearly, and yearly">
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

        {/* Welcome message */}
        <SettingsSection title="Welcome message">
          <SettingsRow label="Configure welcome message">
            <span className="rounded-md border border-border bg-surface-hover px-2.5 py-1 text-xs text-fg-muted">
              Available on Enterprise
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          <SettingsRow label="Delete workspace" description="Schedule workspace to be permanently deleted">
            <Button variant="ghost" className="!w-auto px-3 text-sm text-danger hover:text-danger">
              Delete workspace
            </Button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
