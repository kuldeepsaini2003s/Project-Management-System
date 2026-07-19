import { asyncHandler } from "../utils/asyncHandler.js";
import * as notionService from "../services/NotionService.js";

const reqOrigin = (req) => {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try { return new URL(req.headers.referer).origin; } catch {}
  }
  return undefined;
};

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await notionService.getConnection(req.userId, req.params.id));
});

export const authorize = asyncHandler(async (req, res) => {
  res.json(
    await notionService.buildAuthorizeUrl(req.userId, req.params.id, {
      origin: reqOrigin(req),
      returnPath: req.query.returnPath,
    })
  );
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await notionService.disconnectNotion(req.userId, req.params.id));
});

export const setup = asyncHandler(async (req, res) => {
  const redirect = await notionService.handleOAuthCallback(req.query);
  res.redirect(redirect);
});
