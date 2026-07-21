import { asyncHandler } from "../utils/asyncHandler.js";
import * as slackService from "../services/SlackService.js";
import { reqOrigin } from "../utils/origin.js";

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
