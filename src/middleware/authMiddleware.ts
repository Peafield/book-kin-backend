import type { NextFunction, Request, Response } from "express";
import type { VerifyErrors } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../utils/env";
import logger from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      userDid?: string;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token == null) {
    logger.warn("Auth middleware: No token provided");
    res
      .status(401)
      .json({ success: false, message: "Unauthorized: Token required" });
    return;
  }

  jwt.verify(
    token,
    env.JWT_SECRET,

    (
      err: VerifyErrors | null,
      payload: string | jwt.JwtPayload | undefined
    ): void => {
      if (err) {
        logger.error("Auth middleware: Token verification failed", {
          error: err.message,
        });
        if (err.name === "TokenExpiredError") {
          res
            .status(401)
            .json({ success: false, message: "Unauthorized: Token expired" });
        } else {
          res
            .status(403)
            .json({ success: false, message: "Forbidden: Invalid token" });
        }

        return;
      }

      if (
        typeof payload === "object" &&
        payload &&
        "did" in payload &&
        typeof payload.did === "string"
      ) {
        req.userDid = payload.did;
        logger.info(`Auth middleware: User authenticated DID: ${req.userDid}`);
        next();
      } else {
        logger.error(
          "Auth middleware: Invalid token payload structure",
          payload
        );
        res.status(403).json({
          success: false,
          message: "Forbidden: Invalid token payload",
        });
      }
    }
  );
};
