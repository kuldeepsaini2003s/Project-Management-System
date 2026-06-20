import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import Button from "../../../components/ui/Button.jsx";
import Avatar from "../../../components/ui/Avatar.jsx";

export default function ProfilePage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    title: "",
    username: user?.email?.split("@")[0] || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Profile" />

      <div className="flex flex-col gap-4">
        {/* Profile picture */}
        <SettingsSection>
          <SettingsRow label="Profile picture">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} src={user?.avatarUrl} size="lg" />
              <Button variant="secondary" className="!w-auto px-3 text-xs">
                Change
              </Button>
            </div>
          </SettingsRow>

          {/* Email */}
          <SettingsRow label="Email">
            <div className="flex items-center gap-2">
              <span className="text-sm text-fg">{user?.email || "—"}</span>
              <button className="rounded p-1 text-fg-muted hover:text-fg transition-colors">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" />
                </svg>
              </button>
            </div>
          </SettingsRow>

          {/* Full name */}
          <SettingsRow label="Full name">
            <input
              value={form.name}
              onChange={set("name")}
              className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Your full name"
            />
          </SettingsRow>

          {/* Title */}
          <SettingsRow
            label="Title"
            description="Your job title or role"
          >
            <input
              value={form.title}
              onChange={set("title")}
              className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Software engineer"
            />
          </SettingsRow>

          {/* Username */}
          <SettingsRow
            label="Username"
            description="One word, like a nickname or first name"
          >
            <input
              value={form.username}
              onChange={set("username")}
              className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="username"
            />
          </SettingsRow>
        </SettingsSection>

        {/* Save */}
        <div className="flex justify-end">
          <Button className="!w-auto px-5">Save changes</Button>
        </div>

        {/* Workspace Access */}
        <SettingsSection title="Workspace access">
          <SettingsRow
            label="Remove yourself from workspace"
          >
            <Button variant="ghost" className="!w-auto px-3 text-sm text-danger hover:text-danger">
              Leave workspace
            </Button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
