import {
  type ParsedOpenLibraryData,
  ParsedOpenLibraryDataSchema,
  OpenLibraryApiResponseSchema,
} from "../types";
import { cleanIsbn } from "../utils/cleanIsbn";
import {
  parsePublishers,
  extractCoverUrl,
  extractIdentifier,
  extractOpenLibraryId,
  extractFirstSentence,
  parseAuthors,
} from "../utils/openLibraryUtils";
import logger from "../utils/logger";

export default async function fetchBookDataFromOpenLibrary(
  isbn: string | undefined
): Promise<ParsedOpenLibraryData | null> {
  const cleanedIsbn = cleanIsbn(isbn);
  if (!cleanedIsbn) {
    logger.warn("[OpenLibraryService] No valid ISBN provided.");
    return null;
  }

  const bibkey = `ISBN:${cleanedIsbn}`;
  const url = `https://openlibrary.org/api/books?bibkeys=${bibkey}&jscmd=data&format=json`;
  logger.info(
    `[OpenLibraryService] Fetching data for ${bibkey} from URL: ${url}`
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      logger.error(
        `[OpenLibraryService] Failed to fetch data for ${bibkey}. Status: ${response.status} ${response.statusText}`
      );
      return null;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Parsing unknown external structure before Zod
    const rawJson: any = await response.json();

    const parsedApiResponse = OpenLibraryApiResponseSchema.safeParse(rawJson);

    if (!parsedApiResponse.success) {
      logger.error(
        `[OpenLibraryService] Failed to validate API response structure for ${bibkey}. Zod Errors:`,
        parsedApiResponse.error.flatten()
      );
      return null;
    }

    const rawBookData = parsedApiResponse.data[bibkey];

    if (!rawBookData) {
      logger.info(
        `[OpenLibraryService] No data found for ${bibkey} in Open Library response (after validation).`
      );
      return null;
    }

    logger.info(
      `[OpenLibraryService] Successfully fetched and validated raw data structure for ${bibkey}.`
    );

    const authors = parseAuthors(rawBookData.authors);
    const publishers = parsePublishers(rawBookData.publishers);
    const coverImageUrl = extractCoverUrl(rawBookData.cover);
    const isbn_10 = cleanIsbn(
      extractIdentifier(rawBookData.identifiers, "isbn_10")
    );
    const isbn_13 = cleanIsbn(
      extractIdentifier(rawBookData.identifiers, "isbn_13")
    );
    const googleBooksId = extractIdentifier(rawBookData.identifiers, "google");
    const openLibraryId = extractOpenLibraryId(
      rawBookData.key,
      rawBookData.identifiers
    );
    const first_sentence = extractFirstSentence(rawBookData.excerpts);

    const parsedData: ParsedOpenLibraryData = {
      title: rawBookData.title,
      subtitle: rawBookData.subtitle,
      authors: authors,
      publishers: publishers,
      publish_date: rawBookData.publish_date,
      number_of_pages: rawBookData.number_of_pages,
      isbn_10: isbn_10,
      isbn_13: isbn_13,
      coverImageUrl: coverImageUrl,
      openLibraryId: openLibraryId,
      googleBooksId: googleBooksId,
      first_sentence: first_sentence,
    };

    const finalValidation = ParsedOpenLibraryDataSchema.safeParse(parsedData);
    if (!finalValidation.success) {
      logger.error(
        `[OpenLibraryService] Failed to validate final parsed data structure for ${bibkey}. Zod Errors:`,
        finalValidation.error.flatten()
      );
      return null;
    }

    logger.info(
      `[OpenLibraryService] Successfully parsed data for ${bibkey} into clean format.`
    );
    return finalValidation.data;
  } catch (error) {
    logger.error(
      `[OpenLibraryService] Exception during fetch or processing for ${bibkey}:`,
      error
    );
    return null;
  }
}
