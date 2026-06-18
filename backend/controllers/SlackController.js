import { asyncHandler } from "../utils/asyncHandler.js";
import * as slackService from "../services/SlackService.js";

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await slackService.getConnection(req.userId, req.params.id));
});

export const connect = asyncHandler(async (req, res) => {
  res.status(201).json(
    await slackService.connectSlack(req.userId, req.params.id, req.body.webhookUrl, req.body.channel)
  );
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await slackService.disconnectSlack(req.userId, req.params.id));
});
