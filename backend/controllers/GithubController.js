import { asyncHandler } from "../utils/asyncHandler.js";
import * as githubService from "../services/GithubService.js";

const reqOrigin = (req) => {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
    }
  }
  return undefined;
};

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await githubService.getConnection(req.userId, req.params.id));
});

export const authorize = asyncHandler(async (req, res) => {
  res.json(
    await githubService.buildAuthorizeUrl(req.userId, req.params.id, {
      origin: reqOrigin(req),
      returnPath: req.query.returnPath,
    })
  );
});

export const manage = asyncHandler(async (req, res) => {
  res.json(
    await githubService.buildManageUrl(req.userId, req.params.id, {
      origin: reqOrigin(req),
      returnPath: req.query.returnPath,
    })
  );
});

export const listRepos = asyncHandler(async (req, res) => {
  res.json(await githubService.listRepos(req.userId, req.params.id));
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await githubService.disconnectGithub(req.userId, req.params.id));
});

export const setup = asyncHandler(async (req, res) => {
  const redirect = await githubService.handleSetupCallback(req.query);
  res.redirect(redirect);
});

export const callback = asyncHandler(async (req, res) => {
  const redirect = await githubService.handleOAuthCallback(req.query);
  res.redirect(redirect);
});

export const linkPr = asyncHandler(async (req, res) => {
  res.status(201).json(await githubService.linkPullRequest(req.userId, req.params.id, req.body.url));
});

export const unlinkPr = asyncHandler(async (req, res) => {
  res.json(await githubService.unlinkPullRequest(req.userId, req.params.linkId));
});

export const webhook = asyncHandler(async (req, res) => {
  const event = req.headers["x-github-event"];
  const signature = req.headers["x-hub-signature-256"];
  const result = await githubService.handleGithubWebhook(event, req.body, signature);
  res.json(result);
});
