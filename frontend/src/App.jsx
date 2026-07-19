import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import HomeRedirect from "./pages/HomeRedirect.jsx";
import TeamPage from "./pages/teams/TeamPage.jsx";
import TeamProjectsPage from "./pages/teams/TeamProjectsPage.jsx";
import TeamIssuesPage from "./pages/teams/TeamIssuesPage.jsx";
import GitHubIntegrationPage from "./pages/teams/GitHubIntegrationPage.jsx";
import SlackIntegrationPage from "./pages/teams/SlackIntegrationPage.jsx";
import NotionIntegrationPage from "./pages/teams/NotionIntegrationPage.jsx";
import McpApiPage from "./pages/teams/McpApiPage.jsx";
import JoinTeamPage from "./pages/JoinTeamPage.jsx";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage.jsx";
import WorkspaceProjectsPage from "./pages/projects/WorkspaceProjectsPage.jsx";
import IssueDetailPage from "./pages/issues/IssueDetailPage.jsx";
import MyIssuesPage from "./pages/issues/MyIssuesPage.jsx";
import InvitePage from "./pages/InvitePage.jsx";
import PublicDevProfilePage from "./pages/PublicDevProfilePage.jsx";
import InboxPage from "./pages/InboxPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import WorkspaceMembersPage from "./pages/WorkspaceMembersPage.jsx";
import TeamsListPage from "./pages/TeamsListPage.jsx";

import SettingsLayout from "./components/settings/SettingsLayout.jsx";
import SettingsRedirect from "./pages/settings/SettingsRedirect.jsx";
import PreferencesPage from "./pages/settings/personal/PreferencesPage.jsx";
import ProfilePage from "./pages/settings/personal/ProfilePage.jsx";
import NotificationsPage from "./pages/settings/personal/NotificationsPage.jsx";
import SecurityPage from "./pages/settings/personal/SecurityPage.jsx";
import AccountsPage from "./pages/settings/personal/AccountsPage.jsx";
import DeveloperProfilePage from "./pages/settings/personal/DeveloperProfilePage.jsx";
import IssueLabelsPage from "./pages/settings/issues/IssueLabelsPage.jsx";
import ProjectLabelsPage from "./pages/settings/projects/ProjectLabelsPage.jsx";
import ProjectStatusesPage from "./pages/settings/projects/ProjectStatusesPage.jsx";
import WorkspacePage from "./pages/settings/admin/WorkspacePage.jsx";
import TeamsPage from "./pages/settings/admin/TeamsPage.jsx";
import MembersPage from "./pages/settings/admin/MembersPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/dev/:login" element={<PublicDevProfilePage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/join/:teamId" element={<JoinTeamPage />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/teams/:teamId" element={<TeamPage />} />
          <Route path="/teams/:teamId/projects" element={<TeamProjectsPage />} />
          <Route path="/teams/:teamId/issues" element={<TeamIssuesPage />} />
          <Route path="/teams/:teamId/integrations/github" element={<GitHubIntegrationPage />} />
          <Route path="/teams/:teamId/integrations/slack" element={<SlackIntegrationPage />} />
          <Route path="/teams/:teamId/integrations/notion" element={<NotionIntegrationPage />} />
          <Route path="/teams/:teamId/integrations/mcp" element={<McpApiPage />} />
          <Route path="/projects" element={<WorkspaceProjectsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/members" element={<WorkspaceMembersPage />} />
          <Route path="/teams" element={<TeamsListPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/my-issues" element={<MyIssuesPage />} />
          <Route path="/inbox" element={<InboxPage />} />
        </Route>

        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<SettingsRedirect />} />
          <Route path="preferences" element={<PreferencesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="developer-profile" element={<DeveloperProfilePage />} />
          <Route path="issues/labels" element={<IssueLabelsPage />} />
          <Route path="projects/labels" element={<ProjectLabelsPage />} />
          <Route path="projects/statuses" element={<ProjectStatusesPage />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="members" element={<MembersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
