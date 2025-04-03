import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import Book from "../models/Book";
import { type AddBookInput, AddBookSchema } from "../types";
import logger from "../utils/logger";

export function createApiRouter(): Router {
  const router = Router();
  router.post(
    "/books",
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validationResult = AddBookSchema.safeParse(req.body);
      if (!validationResult.success) {
        logger.warn("Add book validation failed", {
          errors: validationResult.error.flatten(),
        });
        res.status(400).json({
          success: false,
          message: "Invalid request body",
          errors: validationResult.error.flatten().fieldErrors,
        });
        return;
      }
      const bookData: AddBookInput = validationResult.data;
      const userDid = req.userDid;
      if (!userDid) {
        logger.error("User DID missing from request after auth middleware");
        res.status(401).json({ success: false, message: "Unauthorized" });
      }
      try {
        const newBook = new Book({
          ...bookData,
          ownerDid: userDid,
          status: "available",
          borrowerDid: null,
        });
        await newBook.save();
        logger.info(`Book added successfully for user ${userDid}`, {
          bookId: newBook.id,
        });
        res.status(201).json({ success: true, book: newBook.toJSON() });
      } catch (error) {
        logger.error(`Error adding book for user ${userDid}`, { error });
        next(error);
      }
    }
  );
  return router;
}
