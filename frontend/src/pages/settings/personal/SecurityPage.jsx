import { Monitor } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import Button from "../../../components/ui/Button.jsx";

const sessions = [
  {
    id: "current",
    label: "Chrome on Windows",
    meta: "Current session · Udaipur, RJ, IN",
    isCurrent: true,
  },
  {
    id: "other",
    label: "Chrome on Linux",
    meta: "Delhi, DL, IN · Last seen 3 days ago",
    isCurrent: false,
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Security &amp; access" />

      <div className="flex flex-col gap-4">
        {/* Sessions */}
        <SettingsSection
          title="Sessions"
          description="Devices logged into your account"
        >
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
                <Monitor className="h-4 w-4 text-fg-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-fg">{s.label}</p>
                <p className="text-xs text-fg-muted">
                  {s.isCurrent ? (
                    <>
                      <span className="text-success">● Current session</span>
                      {" · Udaipur, RJ, IN"}
                    </>
                  ) : (
                    s.meta
                  )}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-fg-muted">1 other session</span>
            <Button variant="ghost" className="!w-auto px-3 text-sm">
              Revoke all
            </Button>
          </div>
        </SettingsSection>

        {/* Passkeys */}
        <SettingsSection title="Passkeys" description="Passkeys are a secure way to sign in to your Linear account">
          <SettingsRow label="No passkeys registered">
            <Button variant="secondary" className="!w-auto px-3 text-sm">
              New passkey
            </Button>
          </SettingsRow>
        </SettingsSection>

        {/* Personal API Keys */}
        <SettingsSection title="Personal API keys" description="Use Linear's GraphQL API to build your own integrations">
          <SettingsRow label="No API keys created">
            <Button variant="secondary" className="!w-auto px-3 text-sm">
              New API key
            </Button>
          </SettingsRow>
        </SettingsSection>

        {/* Authorized Applications */}
        <SettingsSection title="Authorized applications" description="OAuth applications you've approved">
          <div className="px-5 py-4">
            <p className="text-sm text-fg-muted">No applications have been authorized to connect with your account.</p>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
