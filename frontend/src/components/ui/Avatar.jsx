const sizes = {
  xs: "h-4 w-4 text-[9px]",
  sm: "h-5 w-5 text-[10px]",
  md: "h-6 w-6 text-[11px]",
  lg: "h-8 w-8 text-xs",
  xl: "h-14 w-14 text-lg",
};

// Deterministic accent color from a string.
const palette = ["#5e6ad2", "#26a269", "#d9920a", "#d64545", "#9046c0", "#2a8fbd"];
const colorFor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

export default function Avatar({ name = "", src, size = "md", className = "" }) {
  const initial = name.trim()[0]?.toUpperCase() || "?";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ backgroundColor: colorFor(name) }}
    >
      {initial}
    </span>
  );
}
