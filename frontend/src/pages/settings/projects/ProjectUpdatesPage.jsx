import { useState } from "react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import SettingsToggle from "../../../components/settings/SettingsToggle.jsx";

export default function ProjectUpdatesPage() {
  const [settings, setSettings] = useState({
    weeklyDigest: true,
    statusChangeNotify: true,
    milestoneReminders: false,
    completionReports: true,
  });
  const toggle = (k) => setSettings((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Project updates"
        description="Configure how and when project updates are sent."
      />

      <div className="flex flex-col gap-4">
        <SettingsSection title="Digest">
          <SettingsRow label="Weekly digest" description="Receive a weekly summary of all project activity.">
            <SettingsToggle checked={settings.weeklyDigest} onChange={() => toggle("weeklyDigest")} label="Weekly digest" />
          </SettingsRow>
          <SettingsRow label="Completion reports" description="Get a report when a project is marked as completed.">
            <SettingsToggle checked={settings.completionReports} onChange={() => toggle("completionReports")} label="Completion reports" />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow label="Status change notifications" description="Notify team when a project changes status.">
            <SettingsToggle checked={settings.statusChangeNotify} onChange={() => toggle("statusChangeNotify")} label="Status change notifications" />
          </SettingsRow>
          <SettingsRow label="Milestone reminders" description="Send reminders when project milestones are approaching.">
            <SettingsToggle checked={settings.milestoneReminders} onChange={() => toggle("milestoneReminders")} label="Milestone reminders" />
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
