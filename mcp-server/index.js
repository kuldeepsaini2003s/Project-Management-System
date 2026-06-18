#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const DEFAULT_WEBHOOK = process.env.SLACK_WEBHOOK_URL || "";

// Post a message to a Slack Incoming Webhook.
async function postToSlack(text, webhookUrl) {
  const url = webhookUrl || DEFAULT_WEBHOOK;
  if (!url) throw new Error("No Slack webhook configured. Set SLACK_WEBHOOK_URL or pass webhookUrl.");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Slack returned ${res.status}: ${await res.text()}`);
  return true;
}

// Build a fresh MCP server instance with all tools registered.
function buildServer() {
  const server = new McpServer({ name: "linear-app-slack", version: "1.0.0" });

  server.tool(
    "send_slack_message",
    "Post a plain message to the configured Slack channel (or an explicit webhook URL).",
    {
      text: z.string().describe("The message text (Slack mrkdwn supported)."),
      webhookUrl: z
        .string()
        .url()
        .optional()
        .describe("Optional Slack Incoming Webhook URL to override the default."),
    },
    async ({ text, webhookUrl }) => {
      try {
        await postToSlack(text, webhookUrl);
        return { content: [{ type: "text", text: "Message sent to Slack." }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed: ${e.message}` }], isError: true };
      }
    }
  );

  server.tool(
    "notify_task_mention",
    "Notify a Slack channel that a person was tagged/mentioned on a task.",
    {
      person: z.string().describe("Who was tagged (name or @handle)."),
      message: z.string().describe("The comment or context they were mentioned in."),
      task: z.string().optional().describe("Task identifier or title, e.g. ALG-12."),
      url: z.string().url().optional().describe("Link to the task/issue."),
      webhookUrl: z.string().url().optional().describe("Optional webhook URL override."),
    },
    async ({ person, message, task, url, webhookUrl }) => {
      const lines = [
        `:speech_balloon: *${person}* was tagged${task ? ` on *${task}*` : ""}`,
        message,
        url ? `<${url}|Open task>` : null,
      ].filter(Boolean);
      try {
        await postToSlack(lines.join("\n"), webhookUrl);
        return { content: [{ type: "text", text: `Notified Slack about ${person}.` }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed: ${e.message}` }], isError: true };
      }
    }
  );

  return server;
}

async function runStdio() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio servers must not write to stdout (it's the protocol channel).
  console.error("[mcp] linear-app-slack running on stdio");
}

async function runHttp() {
  const port = Number(process.env.MCP_HTTP_PORT) || 7800;
  const authToken = process.env.MCP_AUTH_TOKEN || "";
  const app = express();
  app.use(express.json());

  // Optional bearer-token auth for remote clients.
  app.use((req, res, next) => {
    if (!authToken) return next();
    const header = req.headers.authorization || "";
    if (header === `Bearer ${authToken}`) return next();
    res.status(401).json({ error: "Unauthorized" });
  });

  app.post("/mcp", async (req, res) => {
    try {
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => transport.close());
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: e.message });
    }
  });

  // Stateless server: GET/DELETE sessions aren't supported.
  const methodNotAllowed = (req, res) =>
    res.status(405).json({ error: "Method not allowed (stateless server)" });
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.listen(port, () => console.error(`[mcp] linear-app-slack HTTP on http://localhost:${port}/mcp`));
}

const useHttp = process.argv.includes("--http") || process.env.MCP_TRANSPORT === "http";
(useHttp ? runHttp() : runStdio()).catch((e) => {
  console.error("[mcp] fatal:", e);
  process.exit(1);
});
