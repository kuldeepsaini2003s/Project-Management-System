# Linear App — Slack MCP Server

An [MCP](https://modelcontextprotocol.io) server that pushes task-mention notifications to a Slack channel. Any MCP client (Claude Desktop, Cursor, ChatGPT custom connectors, etc.) can call its tools.

## Tools

- `send_slack_message({ text, webhookUrl? })` — post a message to Slack.
- `notify_task_mention({ person, message, task?, url?, webhookUrl? })` — post a formatted "X was tagged on TASK" message.

If `webhookUrl` is omitted, the server uses `SLACK_WEBHOOK_URL` from its environment.

## Setup

1. In Slack: **Apps → Incoming Webhooks → Add to Slack**, pick the channel, copy the webhook URL.
2. `cd mcp-server && npm install`
3. Set `SLACK_WEBHOOK_URL` (copy `.env.example` to `.env`, or pass it in the client config below).

## Run

- **stdio (local: Claude Desktop, Cursor):** `node index.js`
- **HTTP (remote: ChatGPT connectors, hosted):** `node index.js --http` → `POST http://localhost:7800/mcp`

## Client configuration

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "linear-slack": {
      "command": "node",
      "args": ["ABSOLUTE/PATH/TO/mcp-server/index.js"],
      "env": { "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/XXX/YYY/ZZZ" }
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "linear-slack": {
      "command": "node",
      "args": ["ABSOLUTE/PATH/TO/mcp-server/index.js"],
      "env": { "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/XXX/YYY/ZZZ" }
    }
  }
}
```

### Remote / ChatGPT (HTTP)

Run `node index.js --http` on a reachable host (set `MCP_AUTH_TOKEN` for a bearer token), then point the client at `https://your-host/mcp` with header `Authorization: Bearer <token>`.

> The Linear App backend also posts to Slack automatically when a teammate is @mentioned in a comment (configured per team in **Integrations → Slack**). This MCP server is the reusable, external interface to the same Slack channel for LLMs and other tools.
