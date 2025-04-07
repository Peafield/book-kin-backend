import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type mongoose from "mongoose";
import { authenticateToken } from "../middleware/authMiddleware";
import type { ICanonicalBook } from "../models/CanonicalBook";
import UserLibraryBook, {
  type IPopulatedUserLibraryBook,
} from "../models/UserLibraryBook";
import {
  BookAlreadyExistsError,
  BookNotFoundError,
  addBookToUserLibrary,
  deleteUserLibraryBook,
  findOrCreateCanonicalBook,
} from "../services/libraryService";
import { type AddBookApiInput, AddBookApiSchema } from "../types";
import logger from "../utils/logger";

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
      // biome-ignore lint/style/noNonNullAssertion: Authenticate token will handle userDid
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

  router.get(
    "/my-library",
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const userDid = req.userDid;
      try {
        const userLibraryBooks: IPopulatedUserLibraryBook[] =
          await UserLibraryBook.find({ ownerDid: userDid }).populate<{
            canonicalBookId: ICanonicalBook;
          }>("canonicalBookId");
        res.status(200).json({ success: true, books: userLibraryBooks });
      } catch (error) {
        logger.error(`Error fetching library for user DID ${userDid}:`, error);
        next(error);
      }
    }
  );

  router.delete(
    "/books/:userLibraryBookId",
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { userLibraryBookId } = req.params;
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const userDid = req.userDid!;

      logger.info(
        `Received DELETE request for book ID: ${userLibraryBookId} from user ${userDid}`
      );

      if (!userLibraryBookId) {
        logger.warn(
          "DELETE /api/books/:userLibraryBookId - Missing book ID in request"
        );
        res
          .status(400)
          .json({ success: false, message: "Book ID parameter is required" });
        return;
      }

      try {
        await deleteUserLibraryBook(userDid, userLibraryBookId);
        logger.info(
          `Successfully processed DELETE for book ID: ${userLibraryBookId} by user ${userDid}`
        );
        res.status(204).send();
      } catch (error) {
        if (error instanceof BookNotFoundError) {
          logger.warn(
            `DELETE /api/books/:userLibraryBookId - Book not found or invalid ID: ${userLibraryBookId} for user ${userDid}`
          );
          res.status(404).json({ success: false, message: error.message });
        } else {
          logger.error(
            `Error in DELETE /api/books/${userLibraryBookId} for user ${userDid}:`,
            error
          );
          next(error);
        }
      }
    }
  );

  return router;
}
