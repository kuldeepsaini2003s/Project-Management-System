import { Routes, Route, Navigate } from "react-router-dom";
import { Inbox } from "lucide-react";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import HomeRedirect from "./pages/HomeRedirect.jsx";
import TeamPage from "./pages/teams/TeamPage.jsx";
import TeamProjectsPage from "./pages/teams/TeamProjectsPage.jsx";
import TeamIssuesPage from "./pages/teams/TeamIssuesPage.jsx";
import JoinTeamPage from "./pages/JoinTeamPage.jsx";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage.jsx";
import WorkspaceProjectsPage from "./pages/projects/WorkspaceProjectsPage.jsx";
import IssueDetailPage from "./pages/issues/IssueDetailPage.jsx";
import MyIssuesPage from "./pages/issues/MyIssuesPage.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* Standalone (no app shell) */}
        <Route path="/join/:teamId" element={<JoinTeamPage />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/teams/:teamId" element={<TeamPage />} />
          <Route path="/teams/:teamId/projects" element={<TeamProjectsPage />} />
          <Route path="/teams/:teamId/issues" element={<TeamIssuesPage />} />
          <Route path="/projects" element={<WorkspaceProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/my-issues" element={<MyIssuesPage />} />
          <Route path="/inbox" element={<ComingSoon title="Inbox" icon={Inbox} />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
