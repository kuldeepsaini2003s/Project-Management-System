import { forwardRef } from "react";

const PillButton = forwardRef(function PillButton(
  { icon: Icon, iconColor, children, active = false, className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
        active
          ? "border-border-strong bg-surface-hover text-fg"
          : "border-border text-fg-muted hover:text-fg"
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" style={iconColor ? { color: iconColor } : undefined} />}
      {children}
    </button>
  );
});

export default PillButton;
