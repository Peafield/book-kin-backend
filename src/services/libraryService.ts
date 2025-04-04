import type mongoose from "mongoose";
import CanonicalBook, { type ICanonicalBook } from "../models/CanonicalBook";
import UserLibraryBook, {
  type IPopulatedUserLibraryBook,
} from "../models/UserLibraryBook";
import type { AddBookApiInput } from "../types";
import logger from "../utils/logger";
import fetchBookDataFromOpenLibrary from "./openLibraryService";

export async function findOrCreateCanonicalBook(
  inputData: AddBookApiInput
): Promise<ICanonicalBook | null> {
  let canonicalBook: ICanonicalBook | null = null;
  const providedIsbn13 = inputData.isbn13?.replace(/-/g, "");
  const providedIsbn10 = inputData.isbn10?.replace(/-/g, "");

  // Try finding by ISBN first
  if (providedIsbn13 || providedIsbn10) {
    const isbnQuery = [];
    if (providedIsbn13) isbnQuery.push({ isbn13: providedIsbn13 });
    if (providedIsbn10) isbnQuery.push({ isbn10: providedIsbn10 });

    if (isbnQuery.length > 0) {
      canonicalBook = await CanonicalBook.findOne({ $or: isbnQuery });
    }

    if (!canonicalBook) {
      logger.info(
        `Canonical book not found for ISBNs [${providedIsbn10}, ${providedIsbn13}]. Fetching from Open Library...`
      );
      const externalData = await fetchBookDataFromOpenLibrary(
        providedIsbn13 || providedIsbn10
      );

      if (externalData) {
        logger.info(
          "Found data on Open Library, creating CanonicalBook entry."
        );
        const dataToSave: Partial<ICanonicalBook> = {
          title: externalData.title || inputData.title || "Unknown Title",
          authors: externalData.authors || inputData.authors || [],
          description: externalData.description || inputData.description,
          coverImageUrl: externalData.coverImageUrl || inputData.coverImageUrl,
          publisher: externalData.publisher,
          publishedDate: externalData.publishedDate,
          openLibraryId: externalData.openLibraryId,
          isbn10: providedIsbn10 || externalData.isbn10 || undefined,
          isbn13: providedIsbn13 || externalData.isbn13 || undefined,
        };
        for (const key of Object.keys(dataToSave)) {
          if (dataToSave[key as keyof ICanonicalBook] === undefined) {
            delete dataToSave[key as keyof ICanonicalBook];
          }
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
          isbn10: providedIsbn10,
          isbn13: providedIsbn13,
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
