export default function SettingsSection({ title, description, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-glass-border bg-surface/40 ${className}`}>
      {(title || description) && (
        <div className="border-b border-glass-border px-5 py-4">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
        </div>
      )}
      <div className="divide-y divide-glass-border">{children}</div>
    </div>
  );
}
