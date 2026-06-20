/** Page title + subtitle used at the top of every settings page */
export default function SettingsPageHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
      {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
    </div>
  );
}
