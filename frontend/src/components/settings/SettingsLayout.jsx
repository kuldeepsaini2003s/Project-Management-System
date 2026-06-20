import { useState } from "react";
import { Outlet } from "react-router-dom";
import Background from "../layout/Background.jsx";
import SettingsSidebar from "./SettingsSidebar.jsx";
import { Menu } from "lucide-react";

/**
 * Full-page settings takeover — mirrors Linear's settings experience.
 * The main app sidebar is completely gone; only the settings nav is shown.
 * Rendered OUTSIDE AppLayout so no app chrome bleeds through.
 */
export default function SettingsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Background />
      <div className="flex h-screen gap-0 p-2">
        {/* Desktop settings sidebar */}
        <div className="hidden md:flex md:flex-col">
          <div className="glass flex h-full w-56 shrink-0 flex-col rounded-2xl">
            <SettingsSidebar />
          </div>
        </div>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-2 top-2 bottom-2 w-56">
              <div className="glass flex h-full flex-col rounded-2xl">
                <SettingsSidebar onClose={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main content column */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 pl-2">
          {/* Mobile topbar */}
          <div className="glass flex h-12 shrink-0 items-center gap-2 rounded-lg px-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              aria-label="Open settings navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-fg">Settings</span>
          </div>

          {/* Page content */}
          <div className="glass min-h-0 flex-1 overflow-y-auto rounded-lg">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
