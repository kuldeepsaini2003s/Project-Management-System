import { useState } from "react";
import { Loader2 } from "lucide-react";
import SettingsPageHeader from "../../../components/settings/SettingsPageHeader.jsx";
import IntegrationRow, { GitHubIcon } from "../../../components/settings/IntegrationRow.jsx";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import {
  useGetWorkspaceTeamsQuery,
  useGetTeamGithubQuery,
  useLazyGetTeamGithubAuthorizeQuery,
  useDisconnectTeamGithubMutation,
  useGetTeamSlackQuery,
  useLazyGetTeamSlackAuthorizeQuery,
  useDisconnectTeamSlackMutation,
  useGetTeamNotionQuery,
  useLazyGetTeamNotionAuthorizeQuery,
  useDisconnectTeamNotionMutation,
} from "../../../redux/apiSlice.js";

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
);

export default function AccountsPage() {
  const { currentId } = useWorkspace();
  const { data: teams = [], isLoading: teamsLoading } = useGetWorkspaceTeamsQuery(currentId, { skip: !currentId });
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const teamId = selectedTeamId || teams[0]?.id || "";

  const integrations = [
    {
      key: "slack",
      icon: <SlackIcon />,
      name: "Slack",
      description: "Receive notifications and sync message attribution in Slack.",
      useConn: useGetTeamSlackQuery,
      useAuth: useLazyGetTeamSlackAuthorizeQuery,
      useDisconn: useDisconnectTeamSlackMutation,
    },
    {
      key: "notion",
      icon: <NotionIcon />,
      name: "Notion",
      description: "Preview issues, projects, and views within Notion.",
      useConn: useGetTeamNotionQuery,
      useAuth: useLazyGetTeamNotionAuthorizeQuery,
      useDisconn: useDisconnectTeamNotionMutation,
    },
    {
      key: "github",
      icon: <GitHubIcon />,
      name: "GitHub",
      description: "Sync attribution of commits, pull requests, and comments.",
      useConn: useGetTeamGithubQuery,
      useAuth: useLazyGetTeamGithubAuthorizeQuery,
      useDisconn: useDisconnectTeamGithubMutation,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <SettingsPageHeader
        title="Connected accounts"
        description="Connect your team's accounts to sync actions between apps."
      />

      {teams.length > 1 && (
        <div className="mb-5 flex items-center gap-3">
          <span className="shrink-0 text-sm text-fg-muted">Team</span>
          <select
            value={teamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="h-8 rounded-md border border-glass-border bg-surface/60 px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {teamsLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-glass-border bg-surface/40 px-5 py-8 text-center text-sm text-fg-muted">
          Create a team first to connect integrations.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-glass-border bg-surface/40">
          {integrations.map((props) => (
            <IntegrationRow key={props.key} {...props} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  );
}
