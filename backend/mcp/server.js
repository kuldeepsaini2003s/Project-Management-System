import { TOOLS } from "./tools.js";
import * as handlers from "./handlers.js";
import { validateApiKey } from "../services/ApiKeyService.js";

const SERVER_INFO = {
  name: "linear-app",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

const extractKey = (req) => {
  const auth = req.headers["authorization"];
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.headers["x-api-key"] || null;
};

const textContent = (text) => ({
  content: [{ type: "text", text: String(text) }],
});

const ok = (id, result) => ({ jsonrpc: "2.0", result, id });

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

async function dispatch(rpc, userId) {
  const { method, params = {}, id } = rpc;

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    });
  }

  if (method === "notifications/initialized") {
    return null;
  }

  if (!userId) {
    return err(id, 401, "Authentication required — pass Authorization: Bearer lnr_<key>");
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

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

export async function mcpHandler(req, res) {
  let userId = null;
  const rawKey = extractKey(req);
  if (rawKey) {
    try {
      userId = await validateApiKey(rawKey);
    } catch {
    }
  }

  const body = req.body;

  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((rpc) => dispatch(rpc, userId).catch((e) => err(rpc?.id ?? null, RPC.INTERNAL_ERROR, e.message)))
    );
    return res.json(responses.filter(Boolean));
  }

  if (!body || typeof body !== "object") {
    return res.status(400).json(err(null, RPC.PARSE_ERROR, "Invalid JSON-RPC request"));
  }

  const response = await dispatch(body, userId).catch((e) =>
    err(body?.id ?? null, RPC.INTERNAL_ERROR, e.message)
  );

  if (response === null) return res.status(204).send();
  return res.json(response);
}
