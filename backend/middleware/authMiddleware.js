import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Require a valid Bearer JWT. Attaches req.userId on success.
 */
export const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.sub;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};
