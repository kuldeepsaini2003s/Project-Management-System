/**
 * MCP (Model Context Protocol) server — JSON-RPC 2.0 over HTTP.
 * Endpoint: POST /api/mcp
 *
 * Auth: Authorization: Bearer lnr_<key>
 *       or X-API-Key: lnr_<key>
 */
import { TOOLS } from "./tools.js";
import * as handlers from "./handlers.js";
import { validateApiKey } from "../services/ApiKeyService.js";

const SERVER_INFO = {
  name: "linear-app",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

/** Extract raw API key from request headers. */
const extractKey = (req) => {
  const auth = req.headers["authorization"];
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.headers["x-api-key"] || null;
};

/** Wrap a result value as an MCP content array. */
const textContent = (text) => ({
  content: [{ type: "text", text: String(text) }],
});

/** Build a JSON-RPC 2.0 success response. */
const ok = (id, result) => ({ jsonrpc: "2.0", result, id });

/** Build a JSON-RPC 2.0 error response. */
const err = (id, code, message, data) => ({
  jsonrpc: "2.0",
  error: { code, message, ...(data ? { data } : {}) },
  id,
});

const RPC = {
  PARSE_ERROR:      -32700,
  INVALID_REQUEST:  -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS:   -32602,
  INTERNAL_ERROR:   -32603,
};

/** Handle one JSON-RPC request object. userId may be null for method=initialize. */
async function dispatch(rpc, userId) {
  const { method, params = {}, id } = rpc;

  // ── initialize ────────────────────────────────────────────────────────────
  if (method === "initialize") {
    return ok(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    });
  }

  if (method === "notifications/initialized") {
    return null; // no response needed for notifications
  }

  // All other methods require auth
  if (!userId) {
    return err(id, 401, "Authentication required — pass Authorization: Bearer lnr_<key>");
  }

  // ── tools/list ────────────────────────────────────────────────────────────
  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  // ── tools/call ────────────────────────────────────────────────────────────
  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;
    if (!name) return err(id, RPC.INVALID_PARAMS, "Missing tool name");

    const handler = handlers[name];
    if (!handler) return err(id, RPC.METHOD_NOT_FOUND, `Unknown tool: ${name}`);

    try {
      const result = await handler(args, userId);
      return ok(id, textContent(result));
    } catch (e) {
      const status = e.statusCode || e.status || 500;
      const code = status === 404 ? RPC.INVALID_PARAMS : RPC.INTERNAL_ERROR;
      return err(id, code, e.message || "Tool execution failed");
    }
  }

  return err(id, RPC.METHOD_NOT_FOUND, `Unknown method: ${method}`);
}

/** Express handler for POST /api/mcp */
export async function mcpHandler(req, res) {
  // Authenticate
  let userId = null;
  const rawKey = extractKey(req);
  if (rawKey) {
    try {
      userId = await validateApiKey(rawKey);
    } catch {
      // userId stays null — dispatch will return 401 for auth-required methods
    }
  }

  const body = req.body;

  // Batch requests (array)
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((rpc) => dispatch(rpc, userId).catch((e) => err(rpc?.id ?? null, RPC.INTERNAL_ERROR, e.message)))
    );
    return res.json(responses.filter(Boolean));
  }

  // Single request
  if (!body || typeof body !== "object") {
    return res.status(400).json(err(null, RPC.PARSE_ERROR, "Invalid JSON-RPC request"));
  }

  const response = await dispatch(body, userId).catch((e) =>
    err(body?.id ?? null, RPC.INTERNAL_ERROR, e.message)
  );

  if (response === null) return res.status(204).send(); // notification — no response
  return res.json(response);
}
