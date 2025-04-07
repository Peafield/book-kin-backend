import type { OpenLibraryRawBook } from "types";

export const parseAuthors = (
  rawAuthors: Array<{ name: string; url?: string }> | undefined
): string[] | undefined => {
  if (!Array.isArray(rawAuthors)) return undefined;
  const names = rawAuthors
    .map((a) => a?.name)
    .filter((name): name is string => !!name);
  return names.length > 0 ? names : undefined;
};

export const parsePublishers = (
  rawPublishers: Array<{ name: string }> | undefined
): string[] | undefined => {
  if (!Array.isArray(rawPublishers)) return undefined;
  const names = rawPublishers
    .map((p) => p?.name)
    .filter((name): name is string => !!name);
  return names.length > 0 ? names : undefined;
};

export const extractIdentifier = (
  identifiers: OpenLibraryRawBook["identifiers"],
  key: keyof NonNullable<OpenLibraryRawBook["identifiers"]>
): string | undefined => {
  const idArray = identifiers?.[key];
  if (
    Array.isArray(idArray) &&
    idArray.length > 0 &&
    typeof idArray[0] === "string"
  ) {
    return idArray[0];
  }
  return undefined;
};

export const extractCoverUrl = (
  cover: OpenLibraryRawBook["cover"]
): string | undefined => {
  if (!cover) return undefined;
  return cover.large || cover.medium || cover.small;
};

export const extractFirstSentence = (
  excerpts: OpenLibraryRawBook["excerpts"]
): string | undefined => {
  if (!Array.isArray(excerpts)) return undefined;
  const firstSentenceExcerpt = excerpts.find((e) => e.first_sentence === true);
  return firstSentenceExcerpt?.text;
};

export const extractOpenLibraryId = (
  key: string | undefined,
  identifiers: OpenLibraryRawBook["identifiers"]
): string | undefined => {
  if (typeof key === "string") {
    const match = key.match(/OL\d+M$/);
    if (match?.[0]) {
      return match[0];
    }
  }
  return extractIdentifier(identifiers, "openlibrary");
};
