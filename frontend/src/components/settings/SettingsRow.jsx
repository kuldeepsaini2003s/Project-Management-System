export default function SettingsRow({ label, description, children, className = "" }) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-4 ${className}`}>
      <div className="min-w-0 flex-1">
        {label && <p className="text-sm font-medium text-fg">{label}</p>}
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
