import { useRef, useState } from "react";
import useClickOutside from "../../hooks/useClickOutside.js";

export default function Popover({ trigger, children, align = "left", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) })}
      {open && (
        <div
          className={`glass-strong absolute top-full z-50 mt-1 min-w-52 rounded-lg p-1 shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          } ${className}`}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
