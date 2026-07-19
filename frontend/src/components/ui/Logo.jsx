export default function Logo({ withWordmark = true, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/brandLogo.png" alt="Up To Date Logo" className="h-22 w-22" />
      {withWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-fg">
          Up To Date
        </span>
      )}
    </div>
  );
}
