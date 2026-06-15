import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as issueService from "../services/IssueService.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const getMyIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.getIssuesCreatedByUser(req.userId));
});

export const getIssue = asyncHandler(async (req, res) => {
  res.json(await issueService.getIssueById(req.userId, req.params.id));
});

export const updateIssue = asyncHandler(async (req, res) => {
  res.json(await issueService.updateIssue(req.userId, req.params.id, req.body));
});

export const reorderIssues = asyncHandler(async (req, res) => {
  res.json(await issueService.reorderIssues(req.userId, req.body.status, req.body.orderedIds));
});

export const deleteIssue = asyncHandler(async (req, res) => {
  await issueService.deleteIssue(req.userId, req.params.id);
  res.status(204).send();
});

export const createSubIssue = asyncHandler(async (req, res) => {
  res.status(201).json(await issueService.createSubIssue(req.userId, req.params.id, req.body));
});

export const addComment = asyncHandler(async (req, res) => {
  res.status(201).json(await issueService.addCommentToIssue(req.userId, req.params.id, req.body.body));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await issueService.deleteComment(req.userId, req.params.id);
  res.status(204).send();
});

export const uploadIssueImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    throw new ApiError(400, "No image file received (field name must be 'images')");
  }

  const urls = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadToCloudinary(file.path);
    if (!url) {
      throw new ApiError(
        502,
        "Image upload to Cloudinary failed — check the CLOUDINARY_* keys in backend/.env (see the server log for the exact error)."
      );
    }
    urls.push(url);
  }

  res.status(201).json(await issueService.addIssueImages(req.userId, req.params.id, urls));
});

export const deleteIssueImage = asyncHandler(async (req, res) => {
  res.json(await issueService.removeIssueImage(req.userId, req.params.id, req.body.url));
});
