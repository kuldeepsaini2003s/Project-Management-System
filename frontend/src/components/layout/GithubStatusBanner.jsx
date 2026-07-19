import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function GithubStatusBanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const status = searchParams.get("github");
    if (!status) return;

    if (status === "connected") {
      setBanner({ type: "success", message: "GitHub connected successfully." });
    } else if (status === "error") {
      setBanner({
        type: "error",
        message: searchParams.get("message") || "Something went wrong connecting GitHub.",
      });
    }

    const next = new URLSearchParams(searchParams);
    next.delete("github");
    next.delete("message");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 8000);
    return () => clearTimeout(t);
  }, [banner]);

  if (!banner) return null;

  return (
    <div
      className={`fixed left-1/2 top-4 z-[100] flex max-w-lg -translate-x-1/2 items-start gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg backdrop-blur ${
        banner.type === "success"
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      }`}
    >
      {banner.type === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="leading-snug">{banner.message}</span>
      <button onClick={() => setBanner(null)} className="ml-1 shrink-0 opacity-70 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
