import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN = 0.25;
const MAX = 5;
const clamp = (v) => Math.min(MAX, Math.max(MIN, v));

export default function ImageLightbox({ src, onClose }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setScale(1);
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "+" || e.key === "=") setScale((s) => clamp(s + 0.25));
      if (e.key === "-") setScale((s) => clamp(s - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  const zoomIn = () => setScale((s) => clamp(s + 0.25));
  const zoomOut = () => setScale((s) => clamp(s - 0.25));
  const reset = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg bg-black/50 p-1 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={zoomOut} className="rounded-md p-1.5 hover:bg-white/15" title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-xs tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className="rounded-md p-1.5 hover:bg-white/15" title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={reset} className="rounded-md p-1.5 hover:bg-white/15" title="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-white/15" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="flex h-full w-full items-center justify-center overflow-auto p-8"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => setScale((s) => clamp(s + (e.deltaY < 0 ? 0.15 : -0.15)))}
      >
        <img
          src={src}
          alt="attachment"
          draggable={false}
          style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
          className="max-h-[85vh] max-w-[90vw] select-none rounded-lg shadow-2xl transition-transform duration-100"
        />
      </div>
    </div>
  );
}
