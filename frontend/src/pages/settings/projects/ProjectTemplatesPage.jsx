import { Box, Plus } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";

export default function ProjectTemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <SettingsPageHeader
        title="Project templates"
        description="Pre-filled templates for projects"
      />

      <div className="mb-4 flex justify-end">
        <Button className="!w-auto px-3 text-sm flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New template
        </Button>
      </div>

      <div className="rounded-xl border border-glass-border bg-surface/40 px-5 py-16 text-center">
        <Box className="mx-auto mb-3 h-8 w-8 text-fg-subtle" />
        <p className="text-sm font-medium text-fg">No project templates yet</p>
        <p className="mt-1 text-xs text-fg-muted">
          Create templates to quickly scaffold new projects with pre-defined structure.
        </p>
        <Button className="mx-auto mt-4 !w-auto px-4 text-sm">
          Create template
        </Button>
      </div>
    </div>
  );
}
