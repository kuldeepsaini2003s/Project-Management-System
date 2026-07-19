import { asyncHandler } from "../utils/asyncHandler.js";
import * as slackService from "../services/SlackService.js";

const reqOrigin = (req) => {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try { return new URL(req.headers.referer).origin; } catch {}
  }
  return undefined;
};

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await slackService.getConnection(req.userId, req.params.id));
});

export const authorize = asyncHandler(async (req, res) => {
  res.json(
    await slackService.buildAuthorizeUrl(req.userId, req.params.id, {
      origin: reqOrigin(req),
      returnPath: req.query.returnPath,
    })
  );
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await slackService.disconnectSlack(req.userId, req.params.id));
});

export const getInfo = asyncHandler(async (req, res) => {
  res.json(await slackService.getSlackInfo(req.userId, req.params.id));
});

export const setup = asyncHandler(async (req, res) => {
  const redirect = await slackService.handleOAuthCallback(req.query);
  res.redirect(redirect);
});
