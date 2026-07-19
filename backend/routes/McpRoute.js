import { Router } from "express";
import { mcpHandler } from "../mcp/server.js";

const router = Router();

router.post("/", mcpHandler);

router.get("/", (req, res) => {
  res.json({
    name:            "Linear App MCP Server",
    version:         "1.0.0",
    protocolVersion: "2024-11-05",
    transport:       "http",
    endpoint:        "/api/mcp",
    auth:            "Authorization: Bearer <your-api-key>",
    docs:            "Send a POST with a JSON-RPC 2.0 body. Call tools/list to see available tools.",
  });
});

export default router;
