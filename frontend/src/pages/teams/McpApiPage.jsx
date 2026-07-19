import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff,
  Terminal, Zap, Loader2, AlertCircle, ChevronDown, ChevronRight,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar.jsx";
import { BACKEND_URL } from "../../utils/constants.js";
import {
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from "../../redux/apiSlice.js";

const MCP_URL = `${BACKEND_URL}/mcp`;

const TOOLS_PREVIEW = [
  { name: "list_teams",          desc: "List all teams the user belongs to" },
  { name: "list_projects",       desc: "List projects in a team with status filter" },
  { name: "create_project",      desc: "Create a new project" },
  { name: "list_issues",         desc: "List issues filtered by status, project, assignee" },
  { name: "get_issue",           desc: "Get full issue details by ID or identifier (e.g. ALG-12)" },
  { name: "create_issue",        desc: "Create an issue — optionally notify Slack in one call" },
  { name: "update_issue",        desc: "Update status, priority, assignee, title" },
  { name: "add_comment",         desc: "Add a comment to an issue" },
  { name: "search_issues",       desc: "Full-text search across issue titles and descriptions" },
  { name: "list_members",        desc: "List team members with roles and user IDs" },
  { name: "send_slack_message",  desc: "Post a message to the team's connected Slack channel" },
];

const CODE_EXAMPLE = `// Initialize
POST ${MCP_URL}
Authorization: Bearer lnr_<your-key>

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}

// Create issue + notify Slack
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "teamId": "<team-id>",
      "title": "Fix login redirect bug",
      "description": "Users get a blank screen after OAuth.",
      "priority": "HIGH",
      "notifySlack": true,
      "slackMessage": "🐛 New issue: Fix login redirect bug — assigned to eng team"
    }
  },
  "id": 2
}`;

const CLAUDE_EXAMPLE = `{
  "mcpServers": {
    "linear-app": {
      "url": "${MCP_URL}",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer lnr_<your-key>"
      }
    }
  }
}`;

function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={`transition-colors ${className}`} title="Copy">
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function KeyRow({ apiKey, onRevoke }) {
  const [confirming, setConfirming] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!confirming) { setConfirming(true); return; }
    setRevoking(true);
    await onRevoke(apiKey.id);
  };

  const lastUsed = apiKey.lastUsedAt
    ? new Date(apiKey.lastUsedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Never used";

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Key className="h-4 w-4 shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{apiKey.name}</p>
        <p className="text-xs text-fg-muted">
          <span className="font-mono">lnr_…{apiKey.hint}</span>
          <span className="mx-1.5 opacity-40">·</span>
          {lastUsed}
        </p>
      </div>
      <button
        onClick={handleRevoke}
        disabled={revoking}
        className={`shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          confirming
            ? "border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border border-glass-border text-fg-muted hover:border-red-400/40 hover:text-red-400"
        }`}
      >
        {revoking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        {confirming ? "Confirm revoke" : "Revoke"}
      </button>
    </div>
  );
}

function CodeBlock({ code, lang = "json" }) {
  return (
    <div className="relative rounded-xl border border-glass-border bg-surface/60 p-4">
      <CopyButton text={code} className="absolute right-3 top-3 text-fg-subtle hover:text-fg" />
      <pre className="overflow-x-auto pr-6 text-xs leading-relaxed text-fg-muted">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Collapsible({ title, icon: Icon, children, isOpen, onToggle }) {
  return (
    <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-2.5 px-5 py-4 text-left transition-colors ${
          isOpen ? "bg-surface/60" : "hover:bg-surface/60"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-brand" />
        <span className="flex-1 text-sm font-medium text-fg">{title}</span>
        {isOpen ? <ChevronDown className="h-4 w-4 text-fg-muted" /> : <ChevronRight className="h-4 w-4 text-fg-muted" />}
      </button>
      {isOpen && <div className="border-t border-glass-border px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

export default function McpApiPage() {
  const { onMenu } = useOutletContext() || {};
  const { data: keys = [], isLoading } = useGetApiKeysQuery();
  const [createKey] = useCreateApiKeyMutation();
  const [revokeKey] = useRevokeApiKeyMutation();

  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [error, setError] = useState("");

  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (id) => setOpenSection((cur) => (cur === id ? null : id));

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const result = await createKey(newKeyName.trim()).unwrap();
      setNewKeyValue(result.key);
      setShowNewKey(true);
      setNewKeyName("");
    } catch (e) {
      setError(e?.data?.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId) => {
    await revokeKey(keyId).unwrap().catch(() => {});
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Topbar breadcrumb={["MCP / API"]} onMenu={onMenu} />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          <div className="flex gap-4">
            <div className="flex h-fit w-fit shrink-0 items-center rounded-2xl bg-surface-hover p-2">
              <Zap className="h-8 w-8 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg">MCP Server & API</h1>
              <p className="mt-1 text-sm text-fg-muted">
                Connect any LLM — Claude, GPT, or your own agent — to this workspace.
                Create issues, notify Slack, and query everything via the Model Context Protocol.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/5 px-5 py-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand/70">MCP Endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-sm text-fg">{MCP_URL}</code>
              <CopyButton text={MCP_URL} className="text-fg-muted hover:text-fg" />
            </div>
            <p className="mt-1 text-xs text-fg-muted">Transport: HTTP · Protocol: JSON-RPC 2.0 · Version: 2024-11-05</p>
          </div>

          <div className="rounded-xl border border-glass-border bg-surface/40 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <h2 className="mb-3 text-sm font-medium text-fg">API Keys</h2>

              {newKeyValue && (
                <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-green-400">
                    ✓ Key created — copy it now, it won't be shown again
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-surface/60 px-3 py-2">
                    <code className="flex-1 truncate font-mono text-sm text-fg">
                      {showNewKey ? newKeyValue : `lnr_${"•".repeat(20)}`}
                    </code>
                    <button onClick={() => setShowNewKey(!showNewKey)} className="text-fg-muted hover:text-fg">
                      {showNewKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <CopyButton text={newKeyValue} className="text-fg-muted hover:text-fg" />
                  </div>
                  <button onClick={() => setNewKeyValue(null)} className="mt-2 text-xs text-fg-subtle hover:text-fg-muted">
                    Dismiss
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Key name (e.g. Claude Desktop, n8n)"
                  className="flex-1 rounded-lg border border-glass-border bg-surface/40 px-3 py-2 text-sm text-fg placeholder-fg-subtle outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/30"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newKeyName.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60 transition-colors"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Generate
                </button>
              </div>

              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-fg-muted" />
              </div>
            ) : keys.length === 0 ? (
              <div className="border-t border-glass-border px-5 py-6 text-center text-sm text-fg-subtle">
                No API keys yet — generate one above
              </div>
            ) : (
              <div className="border-t border-glass-border divide-y divide-glass-border">
                {keys.map((k) => (
                  <KeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} />
                ))}
              </div>
            )}
          </div>

          <Collapsible
            title="Available tools (11)"
            icon={Zap}
            isOpen={openSection === "tools"}
            onToggle={() => toggleSection("tools")}
          >
            <div className="flex flex-col gap-1.5">
              {TOOLS_PREVIEW.map((t) => (
                <div key={t.name} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-surface-hover">
                  <code className="mt-0.5 shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[11px] font-mono text-brand">
                    {t.name}
                  </code>
                  <span className="text-xs text-fg-muted">{t.desc}</span>
                </div>
              ))}
            </div>
          </Collapsible>

          <Collapsible
            title="JSON-RPC usage examples"
            icon={Terminal}
            isOpen={openSection === "examples"}
            onToggle={() => toggleSection("examples")}
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs text-fg-muted">
                Send a <code className="font-mono text-xs text-fg">POST</code> to the endpoint with the{" "}
                <code className="font-mono text-xs text-fg">Authorization: Bearer</code> header.
              </p>
              <CodeBlock code={CODE_EXAMPLE} />
            </div>
          </Collapsible>

          <Collapsible
            title="Claude Desktop config"
            icon={Key}
            isOpen={openSection === "claude"}
            onToggle={() => toggleSection("claude")}
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs text-fg-muted">
                Add this to your{" "}
                <code className="font-mono text-xs text-fg">claude_desktop_config.json</code>{" "}
                to use this app as an MCP server inside Claude Desktop.
              </p>
              <CodeBlock code={CLAUDE_EXAMPLE} />
            </div>
          </Collapsible>

        </div>
      </div>
    </div>
  );
}
