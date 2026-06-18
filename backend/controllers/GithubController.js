import { asyncHandler } from "../utils/asyncHandler.js";
import * as githubService from "../services/GithubService.js";

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await githubService.getConnection(req.userId, req.params.id));
});

// Returns the GitHub App install URL for the frontend to redirect to.
export const authorize = asyncHandler(async (req, res) => {
  res.json(await githubService.buildAuthorizeUrl(req.userId, req.params.id));
});

export const listRepos = asyncHandler(async (req, res) => {
  res.json(await githubService.listRepos(req.userId, req.params.id));
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await githubService.disconnectGithub(req.userId, req.params.id));
});

// Public setup callback — GitHub redirects here after the app is installed.
export const setup = asyncHandler(async (req, res) => {
  const redirect = await githubService.handleSetupCallback(req.query);
  res.redirect(redirect);
});

export const linkPr = asyncHandler(async (req, res) => {
  res.status(201).json(await githubService.linkPullRequest(req.userId, req.params.id, req.body.url));
});

export const unlinkPr = asyncHandler(async (req, res) => {
  res.json(await githubService.unlinkPullRequest(req.userId, req.params.linkId));
});

// Public webhook (signature-verified inside the service). Uses the raw body.
export const webhook = asyncHandler(async (req, res) => {
  const event = req.headers["x-github-event"];
  const signature = req.headers["x-hub-signature-256"];
  const result = await githubService.handleGithubWebhook(event, req.body, signature);
  res.json(result);
});
