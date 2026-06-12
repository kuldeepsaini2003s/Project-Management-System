import { Minus, AlertTriangle, SignalHigh, SignalMedium, SignalLow } from "lucide-react";

export const PRIORITIES = {
  NONE: { label: "No priority", icon: Minus, color: "var(--fg-subtle)" },
  URGENT: { label: "Urgent", icon: AlertTriangle, color: "var(--danger)" },
  HIGH: { label: "High", icon: SignalHigh, color: "#e0a52a" },
  MEDIUM: { label: "Medium", icon: SignalMedium, color: "#9ca0a8" },
  LOW: { label: "Low", icon: SignalLow, color: "#6f747c" },
};

export const PRIORITY_ORDER = ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"];
