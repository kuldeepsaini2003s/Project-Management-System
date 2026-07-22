import { asyncHandler } from "../utils/asyncHandler.js";
import * as gmailService from "../services/GmailService.js";
import * as inboxZeroService from "../services/InboxZeroService.js";
import { reqOrigin } from "../utils/origin.js";

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await gmailService.getConnection(req.userId));
});

export const authorize = asyncHandler(async (req, res) => {
  res.json(
    await gmailService.buildAuthorizeUrl(req.userId, {
      origin: reqOrigin(req),
      returnPath: req.query.returnPath,
    })
  );
});

export const setup = asyncHandler(async (req, res) => {
  res.redirect(await gmailService.handleOAuthCallback(req.query));
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await gmailService.disconnect(req.userId));
});

export const startRun = asyncHandler(async (req, res) => {
  res.json(await inboxZeroService.startRun(req.userId));
});

export const getRunStatus = asyncHandler(async (req, res) => {
  res.json(await inboxZeroService.getRunStatus(req.userId));
});

export const getOverview = asyncHandler(async (req, res) => {
  res.json(await inboxZeroService.getOverview(req.userId));
});
