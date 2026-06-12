import { Routes, Route, Navigate } from "react-router-dom";
import { Inbox, CircleDot, LayoutGrid, Users } from "lucide-react";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ProjectsPage from "./pages/projects/ProjectsPage.jsx";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

export default function App() {
  return (
    <Routes>
      {/* Auth pages — only for logged-out users */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/inbox" element={<ComingSoon title="Inbox" icon={Inbox} />} />
          <Route path="/my-issues" element={<ComingSoon title="My Issues" icon={CircleDot} />} />
          <Route path="/views" element={<ComingSoon title="Views" icon={LayoutGrid} />} />
          <Route path="/teams" element={<ComingSoon title="Teams" icon={Users} />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
