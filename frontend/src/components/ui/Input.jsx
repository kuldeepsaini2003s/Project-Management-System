export default function Input({ label, id, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-10 w-full rounded-md border border-input-border bg-input px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${className}`}
        {...props}
      />
    </div>
  );
}
