export default function Logo({ withWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/logo.webp" alt="Algofolks Logo" className="h-6 w-6" />
      {withWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-fg">
          Algofolks
        </span>
      )}
    </div>
  );
}
