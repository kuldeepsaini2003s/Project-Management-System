import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { assertTeamMembership } from "../utils/membership.js";
import * as issueService from "../services/IssueService.js";
import * as projectService from "../services/ProjectService.js";
import * as slackService from "../services/SlackService.js";


const teamOf = async (userId, teamId) => {
  if (!teamId) throw new ApiError(400, "teamId is required");
  await assertTeamMembership(userId, teamId);
  return prisma.team.findUnique({ where: { id: teamId } });
};

const fmt = (obj) => JSON.stringify(obj, null, 2);


export async function list_teams(args, userId) {
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true, name: true, key: true, icon: true, color: true, description: true,
          _count: { select: { memberships: true, issues: true, projects: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const teams = memberships.map((m) => ({ ...m.team, role: m.role }));
  return `Found ${teams.length} team(s):\n\n${fmt(teams)}`;
}

export async function get_team(args, userId) {
  const team = await teamOf(userId, args.teamId);
  if (!team) throw new ApiError(404, "Team not found");
  const full = await prisma.team.findUnique({
    where: { id: args.teamId },
    include: { _count: { select: { memberships: true, issues: true, projects: true } } },
  });
  return fmt(full);
}

export async function list_projects(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const where = { teamId: args.teamId };
  if (args.status) where.status = args.status;
  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true, name: true, summary: true, status: true, priority: true,
      icon: true, color: true, targetDate: true,
      _count: { select: { issues: true } },
      lead: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return `Found ${projects.length} project(s):\n\n${fmt(projects)}`;
}

export async function create_project(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const project = await projectService.createProject(userId, args.teamId, {
    name: args.name,
    summary: args.summary,
    description: args.description,
    status: args.status || "PLANNED",
    priority: args.priority || "NONE",
  });
  return `Project created:\n\n${fmt({ id: project.id, name: project.name, status: project.status })}`;
}

export async function list_issues(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const limit = Math.min(args.limit || 25, 100);
  const where = { teamId: args.teamId };
  if (args.projectId)  where.projectId  = args.projectId;
  if (args.status)     where.status     = args.status;
  if (args.assigneeId) where.assigneeId = args.assigneeId;

  const issues = await prisma.issue.findMany({
    where,
    select: {
      id: true, number: true, title: true, status: true, priority: true,
      assignee: { select: { id: true, name: true } },
      project:  { select: { id: true, name: true } },
      createdAt: true, updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const team = await prisma.team.findUnique({ where: { id: args.teamId }, select: { key: true } });
  const withId = issues.map((i) => ({ identifier: `${team.key}-${i.number}`, ...i }));
  return `Found ${withId.length} issue(s):\n\n${fmt(withId)}`;
}

export async function get_issue(args, userId) {
  let issue;

  if (args.issueId) {
    issue = await prisma.issue.findUnique({
      where: { id: args.issueId },
      include: {
        team: { select: { id: true, key: true } },
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        labels: { select: { id: true, name: true, color: true } },
        comments: {
          select: { id: true, body: true, createdAt: true, author: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
          take: 10,
        },
      },
    });
  } else if (args.identifier && args.teamId) {
    const [teamKey, num] = args.identifier.split("-");
    const number = parseInt(num);
    if (!teamKey || isNaN(number)) throw new ApiError(400, "identifier must be like 'ALG-12'");
    issue = await prisma.issue.findFirst({
      where: { teamId: args.teamId, number },
      include: {
        team: { select: { id: true, key: true } },
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        labels: { select: { id: true, name: true, color: true } },
        comments: {
          select: { id: true, body: true, createdAt: true, author: { select: { name: true } } },
          orderBy: { createdAt: "asc" }, take: 10,
        },
      },
    });
  } else {
    throw new ApiError(400, "Provide either issueId or (identifier + teamId)");
  }

  if (!issue) throw new ApiError(404, "Issue not found");
  await assertTeamMembership(userId, issue.teamId);

  const identifier = `${issue.team.key}-${issue.number}`;
  return fmt({ identifier, ...issue });
}

export async function create_issue(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const issue = await issueService.createIssue(userId, args.teamId, {
    title:       args.title,
    description: args.description,
    projectId:   args.projectId,
    assigneeId:  args.assigneeId,
    priority:    args.priority || "NONE",
    status:      args.status   || "TODO",
  });

  const team = await prisma.team.findUnique({ where: { id: args.teamId }, select: { key: true } });
  const identifier = `${team.key}-${issue.number}`;

  let slackResult = null;
  if (args.notifySlack) {
    const conn = await prisma.slackConnection.findUnique({ where: { teamId: args.teamId } });
    if (conn?.webhookUrl && conn.active !== false) {
      const msg = args.slackMessage
        || `📋 *New issue created:* <${identifier}> — ${args.title}${args.description ? `\n>${args.description.slice(0, 200)}` : ""}`;
      const ok = await slackService.postToWebhook(conn.webhookUrl, msg);
      slackResult = ok ? `Slack notification sent to ${conn.channel || "channel"}` : "Slack notification failed";
    } else {
      slackResult = "Slack not connected for this team — skipped";
    }
  }

  return fmt({
    id: issue.id,
    identifier,
    title: issue.title,
    status: issue.status,
    url: `/teams/${args.teamId}/issues`,
    slackNotification: slackResult,
  });
}

export async function update_issue(args, userId) {
  if (!args.issueId) throw new ApiError(400, "issueId is required");
  const issue = await prisma.issue.findUnique({ where: { id: args.issueId } });
  if (!issue) throw new ApiError(404, "Issue not found");
  await assertTeamMembership(userId, issue.teamId);

  const data = {};
  if (args.title       !== undefined) data.title       = args.title;
  if (args.description !== undefined) data.description = args.description;
  if (args.status      !== undefined) data.status      = args.status;
  if (args.priority    !== undefined) data.priority    = args.priority;
  if ("assigneeId" in args) data.assigneeId = args.assigneeId || null;
  if ("projectId"  in args) data.projectId  = args.projectId  || null;

  const updated = await prisma.issue.update({ where: { id: args.issueId }, data });
  return `Issue updated:\n\n${fmt({ id: updated.id, status: updated.status, priority: updated.priority })}`;
}

export async function add_comment(args, userId) {
  const { issueId, body } = args;
  if (!body?.trim()) throw new ApiError(400, "body is required");
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new ApiError(404, "Issue not found");
  await assertTeamMembership(userId, issue.teamId);
  const comment = await prisma.comment.create({
    data: { body, issueId, authorId: userId },
    select: { id: true, body: true, createdAt: true },
  });
  return `Comment added:\n\n${fmt(comment)}`;
}

export async function search_issues(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const limit = Math.min(args.limit || 20, 50);
  const issues = await prisma.issue.findMany({
    where: {
      teamId: args.teamId,
      OR: [
        { title:       { contains: args.query, mode: "insensitive" } },
        { description: { contains: args.query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true, number: true, title: true, status: true, priority: true,
      assignee: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  const team = await prisma.team.findUnique({ where: { id: args.teamId }, select: { key: true } });
  const results = issues.map((i) => ({ identifier: `${team.key}-${i.number}`, ...i }));
  return `Found ${results.length} result(s) for "${args.query}":\n\n${fmt(results)}`;
}

export async function list_members(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const members = await prisma.teamMembership.findMany({
    where: { teamId: args.teamId },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return `${members.length} member(s):\n\n${fmt(members.map((m) => ({ ...m.user, role: m.role })))}`;
}

export async function send_slack_message(args, userId) {
  await assertTeamMembership(userId, args.teamId);
  const conn = await prisma.slackConnection.findUnique({ where: { teamId: args.teamId } });
  if (!conn?.webhookUrl || conn.active === false) {
    throw new ApiError(400, "Slack is not connected for this team");
  }
  const ok = await slackService.postToWebhook(conn.webhookUrl, args.message);
  if (!ok) throw new ApiError(502, "Slack message delivery failed");
  return `Message sent to ${conn.channel || conn.slackTeamName || "Slack channel"} ✓`;
}
