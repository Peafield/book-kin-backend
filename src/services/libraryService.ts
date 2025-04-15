import CanonicalBook, { type ICanonicalBook } from "../models/CanonicalBook";
import UserLibraryBook, {
  type IPopulatedUserLibraryBook,
} from "../models/UserLibraryBook";
import mongoose from "mongoose";
import type { AddBookApiInput, ParsedOpenLibraryData } from "../types";
import { cleanIsbn } from "../utils/cleanIsbn";
import logger from "../utils/logger";
import fetchBookDataFromOpenLibrary from "./openLibraryService";

export async function findOrCreateCanonicalBook(
  inputData: AddBookApiInput
): Promise<ICanonicalBook | null> {
  let canonicalBook: ICanonicalBook | null = null;
  const providedIsbn13 = cleanIsbn(inputData.isbn13);
  const providedIsbn10 = cleanIsbn(inputData.isbn10);
  const searchIsbn = providedIsbn13 || providedIsbn10;

  if (providedIsbn10 || providedIsbn13) {
    const dbQuery = [];
    if (providedIsbn13) dbQuery.push({ isbn13: providedIsbn13 });
    if (providedIsbn10) dbQuery.push({ isbn10: providedIsbn10 });
    if (dbQuery.length > 0) {
      canonicalBook = await CanonicalBook.findOne({ $or: dbQuery });
      if (canonicalBook) {
        logger.info(
          `Found existing CanonicalBook ${canonicalBook.id} by provided ISBN.`
        );
        return canonicalBook;
      }
    }
  }

  if (!canonicalBook && searchIsbn) {
    logger.info(
      `Canonical book not found locally for ISBN ${searchIsbn}. Fetching from Open Library...`
    );
    const externalData: ParsedOpenLibraryData | null =
      await fetchBookDataFromOpenLibrary(searchIsbn);

    if (externalData) {
      logger.info(
        `Found data on Open Library for ISBN ${searchIsbn}. Preparing data to save.`
      );

      const externalIsbn10 = externalData.isbn_10;
      const externalIsbn13 = externalData.isbn_13;

      const finalIsbn10 = providedIsbn10 || externalIsbn10;
      const finalIsbn13 = providedIsbn13 || externalIsbn13;

      const dataToSave: Partial<ICanonicalBook> = {
        title: externalData.title || inputData.title || "Unknown Title",
        authors: externalData.authors?.length
          ? externalData.authors
          : inputData.authors,
        isbn10: finalIsbn10,
        isbn13: finalIsbn13,
        description: inputData.description,
        coverImageUrl: externalData.coverImageUrl || inputData.coverImageUrl,
        subtitle: externalData.subtitle,
        numberOfPages: externalData.number_of_pages,
        firstSentence: externalData.first_sentence,
        publisher: externalData.publishers?.join(", "),
        publishedDate: externalData.publish_date,
        openLibraryId: externalData.openLibraryId,
        googleBooksId: externalData.googleBooksId,
      };

      for (const keyStr of Object.keys(dataToSave)) {
        const key = keyStr as keyof ICanonicalBook;
        if (dataToSave[key] === undefined || dataToSave[key] === null) {
          delete dataToSave[key];
        }
        if (
          key === "authors" &&
          Array.isArray(dataToSave[key]) &&
          dataToSave[key]?.length === 0
        ) {
          delete dataToSave[key];
        }
      }

      if (!dataToSave.title || dataToSave.title === "Unknown Title") {
        logger.error(
          "Attempted to save CanonicalBook with no valid title after OpenLibrary fetch."
        );
      } else {
        const finalQuery = [];
        if (dataToSave.isbn13) finalQuery.push({ isbn13: dataToSave.isbn13 });
        if (dataToSave.isbn10) finalQuery.push({ isbn10: dataToSave.isbn10 });
        if (dataToSave.openLibraryId)
          finalQuery.push({ openLibraryId: dataToSave.openLibraryId });

        if (finalQuery.length > 0) {
          canonicalBook = await CanonicalBook.findOne({ $or: finalQuery });
        }

        if (!canonicalBook) {
          logger.info(
            "Creating new CanonicalBook entry from fetched/merged data."
          );
          canonicalBook = new CanonicalBook(dataToSave);
          try {
            await canonicalBook.save();
            logger.info(`Saved new CanonicalBook: ${canonicalBook.id}`);
          } catch (error) {
            logger.error(
              `Error saving new CanonicalBook with data: ${JSON.stringify(
                dataToSave
              )}`,
              error
            );
            return null;
          }
        } else {
          logger.info(
            `Found existing CanonicalBook ${canonicalBook.id} after checking API identifiers. Using existing.`
          );
        }
      }
    } else if (!externalData && searchIsbn) {
      logger.warn(
        `Could not find book data via ISBN ${searchIsbn} from Open Library.`
      );
      if (inputData.title) {
        logger.info(
          "Creating minimal CanonicalBook from user input (ISBN fetch failed/returned no data)."
        );
        canonicalBook = new CanonicalBook({
          title: inputData.title,
          authors: inputData.authors,
          isbn10: providedIsbn10,
          isbn13: providedIsbn13,
          description: inputData.description,
          coverImageUrl: inputData.coverImageUrl,
        });
        try {
          await canonicalBook.save();
          logger.info(`Saved minimal CanonicalBook: ${canonicalBook.id}`);
        } catch (error) {
          logger.error(
            `Error saving minimal CanonicalBook: ${JSON.stringify({
              title: inputData.title,
              isbn10: providedIsbn10,
              isbn13: providedIsbn13,
            })}`,
            error
          );
          return null;
        }
      } else {
        logger.error(
          "Cannot create CanonicalBook: No ISBN match/fetch and no title provided by user."
        );
        return null;
      }
    }
  }

  if (!canonicalBook && inputData.title && !searchIsbn) {
    logger.info(
      "No ISBN provided by user. Creating minimal CanonicalBook from manual input."
    );
    canonicalBook = new CanonicalBook({
      title: inputData.title,
      authors: inputData.authors,
      description: inputData.description,
      coverImageUrl: inputData.coverImageUrl,
    });
    try {
      await canonicalBook.save();
      logger.info(
        `Saved minimal CanonicalBook from title only: ${canonicalBook.id}`
      );
    } catch (error) {
      logger.error(
        `Error saving minimal CanonicalBook from title only: ${JSON.stringify({
          title: inputData.title,
        })}`,
        error
      );
      return null;
    }
  }

  if (!canonicalBook) {
    logger.error(
      "findOrCreateCanonicalBook: Could not find or create CanonicalBook."
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
