import type { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { env } from "../utils/env";

export interface ErrorResponse extends Error {
  statusCode?: number;
  code?: string;
  validation?: Record<string, string[]>;
}

interface ErrorResponsePayload {
  success: boolean;
  message: string;
  code?: string;
  validationErrors?: Record<string, string[]>;
  stack?: string;
}

const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === "production" && err.statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  logger.error({
    statusCode,
    message: err.message,
    code: err.code,
    validationErrors: err.validation,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    query: req.query,
    params: req.params,
    body: req.body,
    headers: req.headers,
  });

  const errorResponse: ErrorResponsePayload = {
    success: false,
    message,
    code: err.code,
  };

  if (err.validation) {
    errorResponse.validationErrors = err.validation;
  }

  if (env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
