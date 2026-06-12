import { asyncHandler } from "../utils/asyncHandler.js";
import * as labelService from "../services/labelService.js";

export const deleteLabel = asyncHandler(async (req, res) => {
  await labelService.remove(req.userId, req.params.id);
  res.status(204).send();
});
