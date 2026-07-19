import { useState } from "react";
import { Monitor, Mail, MessageSquare, ChevronRight } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import SettingsToggle from "../../../components/settings/SettingsToggle.jsx";

const channels = [
  { key: "desktop", label: "Desktop", icon: Monitor, status: "Disabled", enabled: false },
  { key: "email", label: "Email", icon: Mail, status: "Enabled for all notifications", enabled: true },
  { key: "slack", label: "Slack", icon: MessageSquare, status: "Disabled", enabled: false },
];

export default function NotificationsPage() {
  const [toggles, setToggles] = useState({
    showUpdatesInSidebar: true,
    inviteAccepted: true,
    newJoinRequest: true,
    memberJoined: false,
  });

  const toggle = (key) => setToggles((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Notifications" />

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="mb-1 text-base font-semibold text-fg">Notification channels</h2>
          <p className="mb-3 text-xs text-fg-muted">
            Choose how to be notified for workspace activity. Notifications will always go to your Linear inbox.
          </p>
          <SettingsSection>
            {channels.map((ch) => (
              <button
                key={ch.key}
                className="flex w-full items-center gap-4 px-5 py-4 hover:bg-surface-hover transition-colors text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
                  <ch.icon className="h-4 w-4 text-fg-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-fg">{ch.label}</p>
                  <p className={`text-xs ${ch.enabled ? "text-success" : "text-fg-subtle"}`}>
                    {ch.enabled && <span className="mr-1">●</span>}{ch.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-fg-subtle" />
              </button>
            ))}
          </SettingsSection>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-fg">Updates from Linear</h2>
          <p className="mb-3 text-xs text-fg-muted">
            Subscribe to product announcements and important changes from the Linear team
          </p>

          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle px-1">Changelog</p>
              <SettingsSection>
                <SettingsRow label="Show updates in sidebar" description="Highlight new features and improvements in the app sidebar.">
                  <SettingsToggle checked={toggles.showUpdatesInSidebar} onChange={() => toggle("showUpdatesInSidebar")} label="Show updates in sidebar" />
                </SettingsRow>
              </SettingsSection>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle px-1">Other updates</p>
              <SettingsSection>
                <SettingsRow label="Invite accepted" description="Email when invitees accept an invite.">
                  <SettingsToggle checked={toggles.inviteAccepted} onChange={() => toggle("inviteAccepted")} label="Invite accepted" />
                </SettingsRow>
                <SettingsRow label="New join request" description="Email when someone requests to join your workspace.">
                  <SettingsToggle checked={toggles.newJoinRequest} onChange={() => toggle("newJoinRequest")} label="New join request" />
                </SettingsRow>
                <SettingsRow label="Member joined" description="Email when a new member joins your workspace.">
                  <SettingsToggle checked={toggles.memberJoined} onChange={() => toggle("memberJoined")} label="Member joined" />
                </SettingsRow>
              </SettingsSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
