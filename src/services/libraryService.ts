import mongoose from "mongoose";
import CanonicalBook, { type ICanonicalBook } from "../models/CanonicalBook";
import UserLibraryBook, {
  type IPopulatedUserLibraryBook,
} from "../models/UserLibraryBook";
import type { AddBookApiInput } from "../types";
import { cleanIsbn } from "../utils/cleanIsbn";
import logger from "../utils/logger";
import fetchBookDataFromOpenLibrary from "./openLibraryService";

export async function findOrCreateCanonicalBook(
  inputData: AddBookApiInput
): Promise<ICanonicalBook | null> {
  let canonicalBook: ICanonicalBook | null = null;
  const finalIsbn13 = cleanIsbn(inputData.isbn13);
  const finalIsbn10 = cleanIsbn(inputData.isbn10);

  // Try finding by ISBN first
  if (finalIsbn13 || finalIsbn10) {
    const isbnQuery = [];
    if (finalIsbn13) isbnQuery.push({ isbn13: finalIsbn13 });
    if (finalIsbn10) isbnQuery.push({ isbn10: finalIsbn10 });

    if (isbnQuery.length > 0) {
      canonicalBook = await CanonicalBook.findOne({ $or: isbnQuery });
    }

    if (!canonicalBook) {
      logger.info(
        `Canonical book not found for ISBNs [${finalIsbn10}, ${finalIsbn13}]. Fetching from Open Library...`
      );
      const externalData = await fetchBookDataFromOpenLibrary(
        finalIsbn13 || finalIsbn10
      );

      if (externalData) {
        logger.info(
          "Found data on Open Library, creating CanonicalBook entry."
        );
        const externalCleanIsbn13 = cleanIsbn(externalData.isbn13);
        const externalCleanIsbn10 = cleanIsbn(externalData.isbn10);
        const dataToSave: Partial<ICanonicalBook> = {
          title: externalData.title || inputData.title || "Unknown Title",
          authors: externalData.authors || inputData.authors || [],
          description: externalData.description || inputData.description,
          coverImageUrl: externalData.coverImageUrl || inputData.coverImageUrl,
          publisher: externalData.publisher,
          publishedDate: externalData.publishedDate,
          openLibraryId: externalData.openLibraryId,
          isbn10: finalIsbn10 || externalCleanIsbn10,
          isbn13: finalIsbn13 || externalCleanIsbn13,
        };

        for (const key of Object.keys(dataToSave)) {
          if (dataToSave[key as keyof ICanonicalBook] === undefined) {
            delete dataToSave[key as keyof ICanonicalBook];
          }
        }
        if (Object.keys(dataToSave).length === 0 && !dataToSave.title) {
          logger.error("Attempted to save CanonicalBook with no valid data.");
          return null;
        }
        canonicalBook = new CanonicalBook(dataToSave);
        await canonicalBook.save();
        logger.info(`Saved new CanonicalBook: ${canonicalBook.id}`);
      } else {
        logger.warn("Could not find book data via ISBN from external API.");

        if (!inputData.title) return null;

        // Fallback to create minimal manual user input
        logger.info(
          "Creating minimal CanonicalBook from user input (ISBN fetch failed)."
        );
        canonicalBook = new CanonicalBook({
          title: inputData.title,
          authors: inputData.authors,
          isbn10: finalIsbn10,
          isbn13: finalIsbn13,
          description: inputData.description,
          coverImageUrl: inputData.coverImageUrl,
        });
        await canonicalBook.save();
        logger.info(`Saved minimal CanonicalBook: ${canonicalBook.id}`);
      }
    }
  } else if (inputData.title) {
    logger.info(
      "No ISBN provided. Creating minimal CanonicalBook from manual input."
    );
    canonicalBook = new CanonicalBook({
      title: inputData.title,
      authors: inputData.authors,
      description: inputData.description,
      coverImageUrl: inputData.coverImageUrl,
    });
    await canonicalBook.save();
    logger.info(`Saved minimal CanonicalBook: ${canonicalBook.id}`);
  } else {
    logger.error(
      "findOrCreateCanonicalBook: Invalid input - No ISBN or title provided."
    );
    return null;
  }

  return canonicalBook;
}

export class BookAlreadyExistsError extends Error {
  constructor(message = "Book already exists in your library.") {
    super(message);
    this.name = "BookAlreadyExistsError";
  }
}

export async function addBookToUserLibrary(
  userDid: string,
  canonicalBookId: string | mongoose.Types.ObjectId
): Promise<IPopulatedUserLibraryBook> {
  const existingUserBook = await UserLibraryBook.findOne({
    ownerDid: userDid,
    canonicalBookId: canonicalBookId,
  });

  if (existingUserBook) {
    logger.warn(
      `User ${userDid} already has book ${canonicalBookId} in library.`
    );
    throw new BookAlreadyExistsError();
  }

  const newUserBook = new UserLibraryBook({
    ownerDid: userDid,
    canonicalBookId: canonicalBookId,
    status: "available",
    // TODO: Add categories/colorTag later
  });
  await newUserBook.save();
  logger.info(
    `UserLibraryBook entry created: ${newUserBook.id} for user ${userDid}`
  );
  const populatedUserBook = await UserLibraryBook.findById(
    newUserBook._id
  ).populate<{ canonicalBookId: ICanonicalBook }>("canonicalBookId");

  if (!populatedUserBook) {
    throw new Error("Failed to retrieve newly added book details.");
  }

  return populatedUserBook;
}

export class BookNotFoundError extends Error {
  constructor(message = "Book not found in your library.") {
    super(message);
    this.name = "BookNotFoundError";
  }
}

export async function deleteUserLibraryBook(
  userDid: string,
  userLibraryBookId: string
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(userLibraryBookId)) {
    logger.warn(
      `deleteUserLibraryBook: Invalid book ID format received: ${userLibraryBookId}`
    );
    throw new BookNotFoundError(
      `Invalid book ID format: ${userLibraryBookId}.`
    );
  }

  logger.info(
    `Attempting to delete UserLibraryBook ${userLibraryBookId} for user ${userDid}`
  );

  const result = await UserLibraryBook.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(userLibraryBookId),
    ownerDid: userDid,
  });

  if (!result) {
    logger.warn(
      `UserLibraryBook ${userLibraryBookId} not found for user ${userDid} or user does not own it.`
    );
    throw new BookNotFoundError(
      `Book with ID ${userLibraryBookId} not found in your library or you do not have permission to delete it.`
    );
  }

  logger.info(
    `Successfully deleted UserLibraryBook ${userLibraryBookId} for user ${userDid}`
  );
  return true;
}
