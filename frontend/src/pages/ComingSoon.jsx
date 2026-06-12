import { useOutletContext } from "react-router-dom";
import Topbar from "../components/layout/Topbar.jsx";

export default function ComingSoon({ title, icon: Icon }) {
  const { onMenu } = useOutletContext() || {};

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={[title]} onMenu={onMenu} />
      <div className="glass flex flex-1 flex-col items-center justify-center rounded-lg text-center">
        {Icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-fg-muted">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">
          This section is coming in a later step. Workspaces and Projects are
          ready to use now.
        </p>
      </div>
    </div>
  );
}
