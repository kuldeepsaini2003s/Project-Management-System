import { forwardRef } from "react";

const PillButton = forwardRef(function PillButton(
  { icon: Icon, iconColor, children, active = false, className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-surface-hover ${
        active ? "text-fg" : "text-fg-muted"
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" style={iconColor ? { color: iconColor } : undefined} />}
      {children}
    </button>
  );
});

export default PillButton;
