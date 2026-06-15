// Reusable Tailwind class strings, shared across the app.
// (Mirrors the e-commerce app's utils/styles.js convention.)

const styles = {
  // Surfaces
  glassPanel: "glass rounded-lg",
  glassPanelStrong: "glass-strong rounded-lg",

  // Layout
  pageColumn: "flex min-h-0 flex-1 flex-col gap-2",
  scrollArea: "min-h-0 flex-1 overflow-y-auto",

  // Typography
  pageHeading: "text-xl font-semibold tracking-tight text-fg",
  sectionLabel: "text-xs font-medium uppercase tracking-wide text-fg-subtle",
  mutedText: "text-sm text-fg-muted",

  // Forms
  input:
    "w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none",
};

export default styles;
