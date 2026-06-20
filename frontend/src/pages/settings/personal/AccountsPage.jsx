import { ExternalLink } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import Button from "../../../components/ui/Button.jsx";

const connectedAccounts = [
  {
    key: "slack",
    name: "Slack",
    description: "Sync your message attribution, and receive notifications in Slack",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
      </svg>
    ),
  },
  {
    key: "google",
    name: "Google Calendar",
    description: "Sync your calendar out-of-office status to Linear",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M19.5 3H17V1.5A.5.5 0 0 0 16 1.5V3H8V1.5A.5.5 0 0 0 7 1.5V3H4.5A1.5 1.5 0 0 0 3 4.5V20A1.5 1.5 0 0 0 4.5 21.5H19.5A1.5 1.5 0 0 0 21 20V4.5A1.5 1.5 0 0 0 19.5 3ZM19.5 20H4.5V8H19.5Z" fill="#4285F4"/>
        <rect x="6.5" y="11" width="3" height="3" rx="0.5" fill="#34A853"/>
        <rect x="10.5" y="11" width="3" height="3" rx="0.5" fill="#FBBC05"/>
        <rect x="14.5" y="11" width="3" height="3" rx="0.5" fill="#EA4335"/>
        <rect x="6.5" y="15" width="3" height="3" rx="0.5" fill="#EA4335"/>
        <rect x="10.5" y="15" width="3" height="3" rx="0.5" fill="#4285F4"/>
      </svg>
    ),
  },
  {
    key: "notion",
    name: "Notion",
    description: "Preview issues, projects, and views within Notion",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
      </svg>
    ),
  },
  {
    key: "github",
    name: "GitHub",
    description: "Sync attribution of your commits, pull requests, and comments",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
];

export default function AccountsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Connected accounts"
        description="Connect your user accounts to sync attribution of your actions between apps"
      />

      <div className="rounded-xl border border-glass-border bg-surface/40 divide-y divide-glass-border overflow-hidden">
        {connectedAccounts.map((acct) => (
          <div key={acct.key} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-fg">
              {acct.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg">{acct.name}</p>
              <p className="text-xs text-fg-muted truncate">{acct.description}</p>
            </div>
            <Button variant="secondary" className="!w-auto px-3 text-sm flex items-center gap-1.5">
              Connect
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
