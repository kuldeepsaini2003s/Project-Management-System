import { useState } from "react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import SettingsToggle from "../../../components/settings/SettingsToggle.jsx";

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState({
    showCompletedIssues: true,
    groupSubIssues: true,
    showEmptyGroups: false,
    showEstimates: true,
    usePointerCursor: false,
    displayFullNames: false,
    focusMode: false,
    reducedMotion: false,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Preferences" description="Customize your personal Linear experience." />

      <div className="flex flex-col gap-4">
        <SettingsSection title="Interface">
          <SettingsRow label="Show completed issues" description="Display resolved and canceled issues in lists and boards.">
            <SettingsToggle checked={prefs.showCompletedIssues} onChange={() => toggle("showCompletedIssues")} label="Show completed issues" />
          </SettingsRow>
          <SettingsRow label="Group sub-issues" description="Show sub-issues nested under their parent.">
            <SettingsToggle checked={prefs.groupSubIssues} onChange={() => toggle("groupSubIssues")} label="Group sub-issues" />
          </SettingsRow>
          <SettingsRow label="Show empty groups" description="Display status groups even when they have no issues.">
            <SettingsToggle checked={prefs.showEmptyGroups} onChange={() => toggle("showEmptyGroups")} label="Show empty groups" />
          </SettingsRow>
          <SettingsRow label="Show estimates" description="Show effort estimates on issues.">
            <SettingsToggle checked={prefs.showEstimates} onChange={() => toggle("showEstimates")} label="Show estimates" />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <SettingsRow label="Use pointer cursor" description="Show a pointer cursor when hovering interactive elements.">
            <SettingsToggle checked={prefs.usePointerCursor} onChange={() => toggle("usePointerCursor")} label="Use pointer cursor" />
          </SettingsRow>
          <SettingsRow label="Display full names" description="Show full names instead of usernames throughout the app.">
            <SettingsToggle checked={prefs.displayFullNames} onChange={() => toggle("displayFullNames")} label="Display full names" />
          </SettingsRow>
          <SettingsRow label="Reduced motion" description="Minimize animations across the interface.">
            <SettingsToggle checked={prefs.reducedMotion} onChange={() => toggle("reducedMotion")} label="Reduced motion" />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Focus">
          <SettingsRow label="Focus mode" description="Hide the sidebar and navigation when working on an issue.">
            <SettingsToggle checked={prefs.focusMode} onChange={() => toggle("focusMode")} label="Focus mode" />
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
