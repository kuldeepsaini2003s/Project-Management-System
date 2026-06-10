import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as userService from "../services/userService.js";

export const getUsers = asyncHandler(async (req, res) => {
  res.json(await userService.findAll());
});

export const getUser = asyncHandler(async (req, res) => {
  res.json(await userService.findById(req.params.id));
});

export const updateUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) {
    throw new ApiError(403, "You can only update your own profile");
  }
  res.json(await userService.update(req.params.id, req.body));
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.userId) {
    throw new ApiError(403, "You can only delete your own account");
  }
  await userService.remove(req.params.id);
  res.status(204).send();
});
