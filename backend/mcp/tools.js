/**
 * MCP tool definitions — each entry describes one callable tool.
 * JSON Schema in `inputSchema` is shown to the LLM so it knows what args to pass.
 */
export const TOOLS = [
  {
    name: "list_teams",
    description: "List all teams the authenticated user belongs to across their workspace.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_team",
    description: "Get details of a specific team including its key, description, and member count.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "The team ID" },
      },
      required: ["teamId"],
    },
  },
  {
    name: "list_projects",
    description: "List projects in a team, optionally filtered by status.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "The team ID" },
        status: {
          type: "string",
          enum: ["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
          description: "Optional: filter by project status",
        },
      },
      required: ["teamId"],
    },
  },
  {
    name: "create_project",
    description: "Create a new project inside a team.",
    inputSchema: {
      type: "object",
      properties: {
        teamId:      { type: "string", description: "The team ID" },
        name:        { type: "string", description: "Project name" },
        summary:     { type: "string", description: "Short one-line summary" },
        description: { type: "string", description: "Full description (markdown)" },
        status: {
          type: "string",
          enum: ["BACKLOG", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
          description: "Initial project status (default: PLANNED)",
        },
        priority: {
          type: "string",
          enum: ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"],
          description: "Project priority (default: NONE)",
        },
      },
      required: ["teamId", "name"],
    },
  },
  {
    name: "list_issues",
    description: "List issues in a team, optionally filtered by project, status, or assignee.",
    inputSchema: {
      type: "object",
      properties: {
        teamId:    { type: "string", description: "The team ID" },
        projectId: { type: "string", description: "Optional: filter by project ID" },
        status: {
          type: "string",
          enum: ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"],
          description: "Optional: filter by issue status",
        },
        assigneeId: { type: "string", description: "Optional: filter by assignee user ID" },
        limit: { type: "number", description: "Max issues to return (default: 25, max: 100)" },
      },
      required: ["teamId"],
    },
  },
  {
    name: "get_issue",
    description: "Get full details of a specific issue by its ID or team identifier (e.g. 'ALG-12').",
    inputSchema: {
      type: "object",
      properties: {
        issueId:    { type: "string", description: "Issue cuid ID" },
        identifier: { type: "string", description: "Issue identifier like 'ALG-12' (alternative to issueId)" },
        teamId:     { type: "string", description: "Team ID (required when using identifier)" },
      },
    },
  },
  {
    name: "create_issue",
    description: "Create a new issue in a team. Optionally post a Slack notification to the team's connected channel at the same time.",
    inputSchema: {
      type: "object",
      properties: {
        teamId:      { type: "string", description: "The team ID" },
        title:       { type: "string", description: "Issue title" },
        description: { type: "string", description: "Issue description (markdown)" },
        projectId:   { type: "string", description: "Optional: project to assign the issue to" },
        assigneeId:  { type: "string", description: "Optional: user ID to assign the issue to" },
        priority: {
          type: "string",
          enum: ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"],
          description: "Priority (default: NONE)",
        },
        status: {
          type: "string",
          enum: ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"],
          description: "Initial status (default: TODO)",
        },
        notifySlack: {
          type: "boolean",
          description: "If true, also post the issue link to the team's connected Slack channel",
        },
        slackMessage: {
          type: "string",
          description: "Custom Slack message text (defaults to a generated summary if notifySlack is true)",
        },
      },
      required: ["teamId", "title"],
    },
  },
  {
    name: "update_issue",
    description: "Update an existing issue's status, priority, assignee, title, or description.",
    inputSchema: {
      type: "object",
      properties: {
        issueId:     { type: "string", description: "Issue ID" },
        title:       { type: "string", description: "New title" },
        description: { type: "string", description: "New description (markdown)" },
        status: {
          type: "string",
          enum: ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"],
        },
        priority: {
          type: "string",
          enum: ["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"],
        },
        assigneeId: { type: "string", description: "New assignee user ID (pass null to unassign)" },
        projectId:  { type: "string", description: "Move to a different project (pass null to remove)" },
      },
      required: ["issueId"],
    },
  },
  {
    name: "add_comment",
    description: "Add a comment to an issue.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string", description: "Issue ID" },
        body:    { type: "string", description: "Comment text (markdown supported)" },
      },
      required: ["issueId", "body"],
    },
  },
  {
    name: "search_issues",
    description: "Search issues across a team by keyword in title or description.",
    inputSchema: {
      type: "object",
      properties: {
        teamId:  { type: "string", description: "Team ID" },
        query:   { type: "string", description: "Search keyword" },
        limit:   { type: "number", description: "Max results (default: 20)" },
      },
      required: ["teamId", "query"],
    },
  },
  {
    name: "list_members",
    description: "List members of a team with their names, roles, and user IDs.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "string", description: "Team ID" },
      },
      required: ["teamId"],
    },
  },
  {
    name: "send_slack_message",
    description: "Send a message to the Slack channel connected to a team.",
    inputSchema: {
      type: "object",
      properties: {
        teamId:  { type: "string", description: "Team ID (must have Slack connected)" },
        message: { type: "string", description: "Message text to send (plain text or Slack mrkdwn)" },
      },
      required: ["teamId", "message"],
    },
  },
];
