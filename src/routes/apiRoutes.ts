import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { AddBookApiSchema, type AddBookApiInput } from "../types";
import logger from "../utils/logger";
import {
  findOrCreateCanonicalBook,
  addBookToUserLibrary,
  BookAlreadyExistsError,
} from "../services/libraryService";
import type mongoose from "mongoose";

export function createApiRouter(): Router {
  const router = Router();

  router.post(
    "/books",
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const validationResult = AddBookApiSchema.safeParse(req.body);
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
      const inputData: AddBookApiInput = validationResult.data;
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const userDid = req.userDid!;

      try {
        const canonicalBook = await findOrCreateCanonicalBook(inputData);

        if (!canonicalBook) {
          res.status(404).json({
            success: false,
            message: "Book metadata could not be found or created.",
          });
          return;
        }

        const userLibraryBook = await addBookToUserLibrary(
          userDid,
          canonicalBook._id as string | mongoose.Types.ObjectId
        );

        res.status(201).json({ success: true, book: userLibraryBook.toJSON() });
      } catch (error) {
        if (error instanceof BookAlreadyExistsError) {
          res.status(409).json({ success: false, message: error.message });
        }
        logger.error(
          `Error in POST /api/books route for user ${userDid}:`,
          error
        );
        next(error);
      }
    }
  );

  return router;
}
