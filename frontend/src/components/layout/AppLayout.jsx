import { useState } from "react";
import { Outlet } from "react-router-dom";
import Background from "./Background.jsx";
import Sidebar from "./Sidebar.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import FullScreenLoader from "../common/FullScreenLoader.jsx";

export default function AppLayout() {
  const { loading } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <>
        <Background />
        <FullScreenLoader />
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="flex h-screen gap-2 p-2">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-2 top-2 bottom-2">
              <Sidebar onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet context={{ onMenu: () => setMobileOpen(true) }} />
        </div>
      </div>
    </>
  );
}
