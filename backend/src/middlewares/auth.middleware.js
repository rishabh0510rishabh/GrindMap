import jwt from "jsonwebtoken";
import { AppError, ERROR_CODES } from "../utils/appError.js";
import { asyncMiddleware } from "../utils/asyncWrapper.js";
import config from "../config/env.js";

export const protect = asyncMiddleware(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = { id: decoded.id };

      next();
    } catch (error) {
      throw new AppError("Not authorized, token failed", 401, ERROR_CODES.INVALID_TOKEN);
    }
  } else {
    throw new AppError("Not authorized, no token", 401, ERROR_CODES.INVALID_TOKEN);
  }
});
