import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_URL, TOKEN_KEY } from "../utils/constants.js";

const baseQuery = fetchBaseQuery({
  baseUrl: BACKEND_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

// Unwrap RTK Query errors into a readable message.
export const errMsg = (err) =>
  err?.data?.message || err?.error || "Something went wrong. Please try again.";

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Me",
    "Sessions",
    "Workspaces",
    "Workspace",
    "WsMembers",
    "Teams",
    "Team",
    "Members",
    "Labels",
    "Projects",
    "WsProjects",
    "Project",
    "TeamIssues",
    "ProjectIssues",
    "MyIssues",
    "Issue",
    "Requests",
    "MyRequest",
    "GitHubConn",
    "SlackConn",
    "NotionConn",
  ],
  endpoints: (b) => ({
    /* ---- auth / user ---- */
    getMe: b.query({ query: () => "/auth/me", providesTags: ["Me"] }),
    updateUser: b.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Me"],
    }),
    changeEmail: b.mutation({
      query: ({ id, email }) => ({ url: `/users/${id}/email`, method: "PATCH", body: { email } }),
      invalidatesTags: ["Me"],
    }),
    getUserSessions: b.query({
      query: (id) => `/users/${id}/sessions`,
      providesTags: (r, e, id) => [{ type: "Sessions", id }],
    }),
    revokeSession: b.mutation({
      query: ({ userId, sessionId }) => ({ url: `/users/${userId}/sessions/${sessionId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { userId }) => [{ type: "Sessions", id: userId }],
    }),
    revokeAllOtherSessions: b.mutation({
      query: ({ userId }) => ({ url: `/users/${userId}/sessions`, method: "DELETE" }),
      invalidatesTags: (r, e, { userId }) => [{ type: "Sessions", id: userId }],
    }),

    /* ---- workspaces ---- */
    getWorkspaces: b.query({ query: () => "/workspaces", providesTags: ["Workspaces"] }),
    createWorkspace: b.mutation({
      query: (body) => ({ url: "/workspaces", method: "POST", body }),
      invalidatesTags: ["Workspaces"],
    }),
    getWorkspace: b.query({
      query: (id) => `/workspaces/${id}`,
      providesTags: (r, e, id) => [{ type: "Workspace", id }],
    }),
    updateWorkspace: b.mutation({
      query: ({ id, ...body }) => ({ url: `/workspaces/${id}`, method: "PATCH", body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Workspace", id }, "Workspaces"],
    }),
    getWorkspaceMembers: b.query({
      query: (id) => `/workspaces/${id}/members`,
      providesTags: (r, e, id) => [{ type: "WsMembers", id }],
    }),

    /* ---- teams ---- */
    getWorkspaceTeams: b.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/teams`,
      providesTags: (r, e, workspaceId) => [{ type: "Teams", id: workspaceId }],
    }),
    createTeam: b.mutation({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/teams`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { workspaceId }) => [{ type: "Teams", id: workspaceId }],
    }),
    getTeam: b.query({
      query: (id) => `/teams/${id}`,
      providesTags: (r, e, id) => [{ type: "Team", id }],
    }),
    updateTeam: b.mutation({
      query: ({ id, ...body }) => ({ url: `/teams/${id}`, method: "PATCH", body }),
      invalidatesTags: (r, e, { id, workspaceId }) => [{ type: "Team", id }, { type: "Teams", id: workspaceId }],
    }),
    deleteTeam: b.mutation({
      query: ({ id }) => ({ url: `/teams/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, { workspaceId }) => [{ type: "Teams", id: workspaceId }],
    }),

    /* ---- team members ---- */
    getTeamMembers: b.query({
      query: (teamId) => `/teams/${teamId}/members`,
      providesTags: (r, e, teamId) => [{ type: "Members", id: teamId }],
    }),
    addTeamMember: b.mutation({
      query: ({ teamId, userId, role }) => ({
        url: `/teams/${teamId}/members`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: (r, e, { teamId }) => [{ type: "Members", id: teamId }],
    }),
    removeTeamMember: b.mutation({
      query: ({ teamId, userId }) => ({
        url: `/teams/${teamId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, { teamId }) => [{ type: "Members", id: teamId }],
    }),

    /* ---- join requests ---- */
    getTeamRequests: b.query({
      query: (teamId) => `/teams/${teamId}/requests`,
      providesTags: (r, e, teamId) => [{ type: "Requests", id: teamId }],
    }),
    getTeamPublic: b.query({ query: (teamId) => `/teams/${teamId}/public` }),
    getMyRequest: b.query({
      query: (teamId) => `/teams/${teamId}/my-request`,
      providesTags: (r, e, teamId) => [{ type: "MyRequest", id: teamId }],
    }),
    requestJoin: b.mutation({
      query: (teamId) => ({ url: `/teams/${teamId}/join`, method: "POST" }),
      invalidatesTags: (r, e, teamId) => [{ type: "MyRequest", id: teamId }],
    }),
    respondRequest: b.mutation({
      query: ({ requestId, accept }) => ({
        url: `/join-requests/${requestId}/respond`,
        method: "POST",
        body: { accept },
      }),
      invalidatesTags: (r, e, { teamId }) => [
        { type: "Requests", id: teamId },
        { type: "Members", id: teamId },
      ],
    }),

    /* ---- email invites ---- */
    createTeamInvites: b.mutation({
      query: ({ teamId, emails, role }) => ({
        url: `/teams/${teamId}/invites`,
        method: "POST",
        body: { emails, role },
      }),
      invalidatesTags: (r, e, { teamId }) => [{ type: "Members", id: teamId }],
    }),
    getInvite: b.query({ query: (token) => `/invites/${token}` }),
    acceptInvite: b.mutation({
      query: (token) => ({ url: `/invites/${token}/accept`, method: "POST" }),
      invalidatesTags: ["Teams", "Workspaces"],
    }),

    /* ---- labels (workspace-scoped) ---- */
    getWorkspaceLabels: b.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/labels`,
      providesTags: (r, e, workspaceId) => [{ type: "Labels", id: workspaceId }],
    }),
    createLabel: b.mutation({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/labels`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { workspaceId }) => [{ type: "Labels", id: workspaceId }],
    }),
    updateLabel: b.mutation({
      query: ({ id, ...body }) => ({ url: `/labels/${id}`, method: "PATCH", body }),
      invalidatesTags: (r, e, { workspaceId }) => [{ type: "Labels", id: workspaceId }],
    }),
    deleteLabel: b.mutation({
      query: ({ id }) => ({ url: `/labels/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, { workspaceId }) => [{ type: "Labels", id: workspaceId }],
    }),

    /* ---- projects ---- */
    getTeamProjects: b.query({
      query: (teamId) => `/teams/${teamId}/projects`,
      providesTags: (r, e, teamId) => [{ type: "Projects", id: teamId }],
    }),
    getWorkspaceProjects: b.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/projects`,
      providesTags: ["WsProjects"],
    }),
    getProject: b.query({
      query: (id) => `/projects/${id}`,
      providesTags: (r, e, id) => [{ type: "Project", id }],
    }),
    createProject: b.mutation({
      query: ({ teamId, ...body }) => ({
        url: `/teams/${teamId}/projects`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { teamId }) => [{ type: "Projects", id: teamId }, "WsProjects"],
    }),
    updateProject: b.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      invalidatesTags: (r, e, { id, teamId }) => [
        { type: "Project", id },
        { type: "Projects", id: teamId },
        "WsProjects",
      ],
    }),
    deleteProject: b.mutation({
      query: ({ id }) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, { teamId }) => [{ type: "Projects", id: teamId }, "WsProjects"],
    }),

    /* ---- issues ---- */
    getTeamIssues: b.query({
      query: (teamId) => `/teams/${teamId}/issues`,
      providesTags: (r, e, teamId) => [{ type: "TeamIssues", id: teamId }],
    }),
    getProjectIssues: b.query({
      query: (projectId) => `/projects/${projectId}/issues`,
      providesTags: (r, e, projectId) => [{ type: "ProjectIssues", id: projectId }],
    }),
    getMyIssues: b.query({ query: () => "/issues/mine", providesTags: ["MyIssues"] }),
    getIssue: b.query({
      query: (id) => `/issues/${id}`,
      providesTags: (r, e, id) => [{ type: "Issue", id }],
    }),
    createIssue: b.mutation({
      query: ({ teamId, ...body }) => ({
        url: `/teams/${teamId}/issues`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { teamId, projectId }) =>
        [
          { type: "TeamIssues", id: teamId },
          projectId && { type: "ProjectIssues", id: projectId },
          "MyIssues",
        ].filter(Boolean),
    }),
    updateIssue: b.mutation({
      query: ({ id, ...body }) => ({ url: `/issues/${id}`, method: "PATCH", body }),
      invalidatesTags: (r, e, { id, teamId, projectId }) =>
        [
          { type: "Issue", id },
          teamId && { type: "TeamIssues", id: teamId },
          projectId && { type: "ProjectIssues", id: projectId },
          "MyIssues",
        ].filter(Boolean),
    }),
    deleteIssue: b.mutation({
      query: ({ id }) => ({ url: `/issues/${id}`, method: "DELETE" }),
      invalidatesTags: (r, e, { teamId, projectId }) =>
        [
          teamId && { type: "TeamIssues", id: teamId },
          projectId && { type: "ProjectIssues", id: projectId },
          "MyIssues",
        ].filter(Boolean),
    }),
    createSubIssue: b.mutation({
      query: ({ parentId, ...body }) => ({
        url: `/issues/${parentId}/sub-issues`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, { parentId, teamId }) =>
        [{ type: "Issue", id: parentId }, teamId && { type: "TeamIssues", id: teamId }].filter(
          Boolean
        ),
    }),
    addComment: b.mutation({
      query: ({ issueId, body, mentionIds }) => ({
        url: `/issues/${issueId}/comments`,
        method: "POST",
        body: { body, mentionIds },
      }),
      invalidatesTags: (r, e, { issueId }) => [{ type: "Issue", id: issueId }],
    }),
    deleteComment: b.mutation({
      query: ({ commentId }) => ({ url: `/comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { issueId }) => [{ type: "Issue", id: issueId }],
    }),

    /* ---- team integrations: GitHub ---- */
    getTeamGithub: b.query({
      query: (teamId) => `/teams/${teamId}/github`,
      providesTags: (r, e, teamId) => [{ type: "GitHubConn", id: teamId }],
    }),
    getTeamGithubAuthorize: b.query({
      query: (teamId) => `/teams/${teamId}/github/authorize`,
    }),
    getTeamGithubRepos: b.query({
      query: (teamId) => `/teams/${teamId}/github/repos`,
      providesTags: (r, e, teamId) => [{ type: "GitHubConn", id: teamId }],
    }),
    disconnectTeamGithub: b.mutation({
      query: (teamId) => ({ url: `/teams/${teamId}/github`, method: "DELETE" }),
      invalidatesTags: (r, e, teamId) => [{ type: "GitHubConn", id: teamId }],
    }),

    /* ---- team integrations: Slack ---- */
    getTeamSlack: b.query({
      query: (teamId) => `/teams/${teamId}/slack`,
      providesTags: (r, e, teamId) => [{ type: "SlackConn", id: teamId }],
    }),
    getTeamSlackAuthorize: b.query({
      query: (teamId) => `/teams/${teamId}/slack/authorize`,
    }),
    getTeamSlackInfo: b.query({
      query: (teamId) => `/teams/${teamId}/slack/info`,
      providesTags: (r, e, teamId) => [{ type: "SlackConn", id: teamId }],
    }),
    disconnectTeamSlack: b.mutation({
      query: (teamId) => ({ url: `/teams/${teamId}/slack`, method: "DELETE" }),
      invalidatesTags: (r, e, teamId) => [{ type: "SlackConn", id: teamId }],
    }),

    /* ---- team integrations: Notion ---- */
    getTeamNotion: b.query({
      query: (teamId) => `/teams/${teamId}/notion`,
      providesTags: (r, e, teamId) => [{ type: "NotionConn", id: teamId }],
    }),
    getTeamNotionAuthorize: b.query({
      query: (teamId) => `/teams/${teamId}/notion/authorize`,
    }),
    disconnectTeamNotion: b.mutation({
      query: (teamId) => ({ url: `/teams/${teamId}/notion`, method: "DELETE" }),
      invalidatesTags: (r, e, teamId) => [{ type: "NotionConn", id: teamId }],
    }),

    /* ---- API Keys ---- */
    getApiKeys: b.query({
      query: () => "/keys",
      providesTags: ["ApiKey"],
    }),
    createApiKey: b.mutation({
      query: (name) => ({ url: "/keys", method: "POST", body: { name } }),
      invalidatesTags: ["ApiKey"],
    }),
    revokeApiKey: b.mutation({
      query: (keyId) => ({ url: `/keys/${keyId}`, method: "DELETE" }),
      invalidatesTags: ["ApiKey"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateUserMutation,
  useChangeEmailMutation,
  useGetUserSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllOtherSessionsMutation,
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceTeamsQuery,
  useCreateTeamMutation,
  useGetTeamQuery,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetTeamRequestsQuery,
  useGetTeamPublicQuery,
  useGetMyRequestQuery,
  useRequestJoinMutation,
  useRespondRequestMutation,
  useCreateTeamInvitesMutation,
  useGetInviteQuery,
  useAcceptInviteMutation,
  useGetWorkspaceLabelsQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
  useGetTeamProjectsQuery,
  useGetWorkspaceProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetTeamIssuesQuery,
  useGetProjectIssuesQuery,
  useGetMyIssuesQuery,
  useGetIssueQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useCreateSubIssueMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  /* integrations */
  useGetTeamGithubQuery,
  useLazyGetTeamGithubAuthorizeQuery,
  useGetTeamGithubReposQuery,
  useDisconnectTeamGithubMutation,
  useGetTeamSlackQuery,
  useLazyGetTeamSlackAuthorizeQuery,
  useGetTeamSlackInfoQuery,
  useDisconnectTeamSlackMutation,
  useGetTeamNotionQuery,
  useLazyGetTeamNotionAuthorizeQuery,
  useDisconnectTeamNotionMutation,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} = api;
