import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as userService from "../services/userService.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.findById(Number(req.params.id));
  if (!user) throw new ApiError(404, "User not found");
  res.json(user);
});

export const createUser = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  if (!email) throw new ApiError(400, "Email is required");
  const user = await userService.create({ email, name });
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  const user = await userService.update(Number(req.params.id), { email, name });
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.remove(Number(req.params.id));
  res.status(204).send();
});
