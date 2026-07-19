import { useState, useEffect, useRef } from "react";
import { Check, Pencil, X, Camera } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useUpdateUserMutation, useChangeEmailMutation } from "../../../redux/apiSlice.js";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import SettingsSection from "../../../components/settings/SettingsSection.jsx";
import SettingsRow from "../../../components/settings/SettingsRow.jsx";
import Button from "../../../components/ui/Button.jsx";
import Avatar from "../../../components/ui/Avatar.jsx";
import Modal from "../../../components/ui/Modal.jsx";

function SaveRow({ dirty, saving, onSave }) {
  const [saved, setSaved] = useState(false);
  const handleSave = async () => {
    await onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  if (!dirty && !saved) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      {saved && (
        <span className="flex items-center gap-1 text-xs text-success">
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      {dirty && (
        <Button className="!w-auto px-5" onClick={handleSave} isLoading={saving}>
          Save changes
        </Button>
      )}
    </div>
  );
}

function ChangeEmailModal({ open, onClose, userId, currentEmail }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [changeEmail, { isLoading }] = useChangeEmailMutation();

  useEffect(() => { if (open) { setEmail(""); setError(""); } }, [open]);

  const handleSave = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    try {
      await changeEmail({ id: userId, email: email.trim() }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to update email");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change email"
      footer={
        <>
          <Button variant="secondary" className="!w-auto px-4" onClick={onClose}>Cancel</Button>
          <Button className="!w-auto px-4" onClick={handleSave} isLoading={isLoading}>
            Check for existing account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted leading-relaxed">
          If you'd like to change the email address for your account, we'll send a verification
          link to your new email address. This change will apply across all workspaces that you
          are a member of.
        </p>
        <p className="text-sm text-fg-muted leading-relaxed">
          Please check if the new email address is tied to an existing account before proceeding
          with the change.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">
            Enter the new email address you'd like to use.
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="New email address"
            className="h-9 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
            autoFocus
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [usernameError, setUsernameError] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const nameDirty = name.trim() !== (user?.name || "");
  const usernameDirty = (username || "") !== (user?.username || "");

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setAvatarPreview(dataUrl);
      await updateUser({ id: user.id, avatarUrl: dataUrl }).unwrap().catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    await updateUser({ id: user.id, name: name.trim() }).unwrap();
  };

  const handleSaveUsername = async () => {
    setUsernameError("");
    try {
      await updateUser({ id: user.id, username: username.trim() || null }).unwrap();
    } catch (err) {
      setUsernameError(err?.data?.message || "Username already taken");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader title="Profile" />

      <div className="flex flex-col gap-4">
        <SettingsSection>
          <SettingsRow label="Profile picture">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileRef.current?.click()}
              title="Click to change photo"
            >
              <Avatar name={user?.name} src={avatarPreview} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </SettingsRow>

          <SettingsRow label="Email">
            <div className="flex items-center gap-2">
              <span className="text-sm text-fg">{user?.email || "—"}</span>
              <button
                onClick={() => setEmailModalOpen(true)}
                className="rounded p-1 text-fg-muted hover:text-fg transition-colors"
                title="Change email"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </SettingsRow>

          <SettingsRow label="Full name">
            <div className="flex flex-col gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nameDirty && handleSaveName()}
                className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Your full name"
              />
              <SaveRow dirty={nameDirty} saving={saving} onSave={handleSaveName} />
            </div>
          </SettingsRow>

          <SettingsRow label="Username" description="Unique identifier across the workspace">
            <div className="flex flex-col gap-2">
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
                onKeyDown={(e) => e.key === "Enter" && usernameDirty && handleSaveUsername()}
                className="w-56 rounded-md border border-input-border bg-input px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="yourname"
              />
              {usernameError && <p className="text-xs text-danger">{usernameError}</p>}
              <SaveRow dirty={usernameDirty} saving={saving} onSave={handleSaveUsername} />
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>

      <ChangeEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        userId={user?.id}
        currentEmail={user?.email}
      />
    </div>
  );
}
