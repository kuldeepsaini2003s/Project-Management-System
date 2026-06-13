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
    "Workspaces",
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
  ],
  endpoints: (b) => ({
    /* ---- auth / workspace ---- */
    getMe: b.query({ query: () => "/auth/me", providesTags: ["Me"] }),

    getWorkspaces: b.query({ query: () => "/workspaces", providesTags: ["Workspaces"] }),
    createWorkspace: b.mutation({
      query: (body) => ({ url: "/workspaces", method: "POST", body }),
      invalidatesTags: ["Workspaces"],
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
      invalidatesTags: (r, e, { id }) => [{ type: "Team", id }],
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
      query: ({ issueId, body }) => ({
        url: `/issues/${issueId}/comments`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: (r, e, { issueId }) => [{ type: "Issue", id: issueId }],
    }),
    deleteComment: b.mutation({
      query: ({ commentId }) => ({ url: `/comments/${commentId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { issueId }) => [{ type: "Issue", id: issueId }],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceTeamsQuery,
  useCreateTeamMutation,
  useGetTeamQuery,
  useUpdateTeamMutation,
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetTeamRequestsQuery,
  useGetTeamPublicQuery,
  useGetMyRequestQuery,
  useRequestJoinMutation,
  useRespondRequestMutation,
  useGetWorkspaceLabelsQuery,
  useCreateLabelMutation,
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
} = api;
