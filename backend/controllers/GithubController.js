import { asyncHandler } from "../utils/asyncHandler.js";
import * as githubService from "../services/GithubService.js";

// Origin of the frontend that initiated the request, so GitHub can redirect the
// user back to the SAME app (works across localhost / deployed frontends).
const reqOrigin = (req) => {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
      /* ignore */
    }
  }
  return undefined;
};

export const getConnection = asyncHandler(async (req, res) => {
  res.json(await githubService.getConnection(req.userId, req.params.id));
});

// Returns either { url } to redirect the user to GitHub's install flow, or
// { reconnected: true } if an existing valid installation was reactivated instantly.
export const authorize = asyncHandler(async (req, res) => {
  res.json(
    await githubService.buildAuthorizeUrl(req.userId, req.params.id, { origin: reqOrigin(req) })
  );
});

// Returns GitHub's "configure repositories" page URL for an existing install.
export const manage = asyncHandler(async (req, res) => {
  res.json(await githubService.buildManageUrl(req.userId, req.params.id, { origin: reqOrigin(req) }));
});

export const listRepos = asyncHandler(async (req, res) => {
  res.json(await githubService.listRepos(req.userId, req.params.id));
});

export const disconnect = asyncHandler(async (req, res) => {
  res.json(await githubService.disconnectGithub(req.userId, req.params.id));
});

// Public setup callback — GitHub redirects here after the app is installed.
// (Only used while the App still has a "Setup URL" configured — see callback below.)
export const setup = asyncHandler(async (req, res) => {
  const redirect = await githubService.handleSetupCallback(req.query);
  res.redirect(redirect);
});

// Public OAuth callback — GitHub redirects here once "Request user
// authorization (OAuth) during installation" is enabled on the App. This is
// the reliable path: it fires whether the user is installing fresh or already
// had the app installed, fixing the dead-end redirect to GitHub's own
// installation management page.
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

// Public webhook (signature-verified inside the service). Uses the raw body.
export const webhook = asyncHandler(async (req, res) => {
  const event = req.headers["x-github-event"];
  const signature = req.headers["x-hub-signature-256"];
  const result = await githubService.handleGithubWebhook(event, req.body, signature);
  res.json(result);
});
