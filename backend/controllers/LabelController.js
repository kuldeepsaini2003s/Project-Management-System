import { asyncHandler } from "../utils/asyncHandler.js";
import * as labelService from "../services/LabelService.js";

export const deleteLabel = asyncHandler(async (req, res) => {
  await labelService.deleteLabel(req.userId, req.params.id);
  res.status(204).send();
});
