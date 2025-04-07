import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

export interface AppUserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
  banner?: string;
}

export interface AuthRedirectData {
  appToken: string;
  profileData: AppUserProfile;
}

export interface AppJwtPayload extends JwtPayload {
  did: string;
}

export const AddBookApiSchema = z
  .object({
    isbn10: z.string().trim().optional(),
    isbn13: z.string().trim().optional(),
    title: z.string().trim().optional(),
    authors: z.array(z.string().trim().min(1)).optional().default([]),
    description: z.string().trim().optional(),
    coverImageUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine((data) => data.isbn10 || data.isbn13 || data.title, {
    message: "Either ISBN (10 or 13) or Title must be provided",
  });

export type AddBookApiInput = z.infer<typeof AddBookApiSchema>;

const OpenLibraryRawBookSchema = z
  .object({
    url: z.string().url().optional(),
    key: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    authors: z
      .array(
        z.object({
          url: z.string().url().optional(),
          name: z.string(),
        })
      )
      .optional(),
    number_of_pages: z.number().optional(),
    identifiers: z
      .object({
        isbn_10: z.array(z.string()).optional(),
        isbn_13: z.array(z.string()).optional(),
        goodreads: z.array(z.string()).optional(),
        librarything: z.array(z.string()).optional(),
        google: z.array(z.string()).optional(),
        openlibrary: z.array(z.string()).optional(),
      })
      .optional(),
    publishers: z
      .array(
        z.object({
          name: z.string(),
        })
      )
      .optional(),
    publish_date: z.string().optional(),
    subjects: z
      .array(z.object({ name: z.string(), url: z.string().url() }))
      .optional(),
    excerpts: z
      .array(
        z.object({
          text: z.string(),
          comment: z.string().optional(),
          first_sentence: z.boolean().optional(),
        })
      )
      .optional(),
    ebooks: z
      .array(
        z.object({
          preview_url: z.string().url().optional(),
          availability: z.string().optional(),
        })
      )
      .optional(),
    cover: z
      .object({
        small: z.string().url().optional(),
        medium: z.string().url().optional(),
        large: z.string().url().optional(),
      })
      .optional(),
  })
  .passthrough();

export type OpenLibraryRawBook = z.infer<typeof OpenLibraryRawBookSchema>;

export const OpenLibraryApiResponseSchema = z.record(OpenLibraryRawBookSchema);

export const ParsedOpenLibraryDataSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()).optional(),
  subtitle: z.string().optional(),
  publishers: z.array(z.string()).optional(),
  publish_date: z.string().optional(),
  number_of_pages: z.number().optional(),
  isbn_10: z.string().optional(),
  isbn_13: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  openLibraryId: z.string().optional(),
  googleBooksId: z.string().optional(),
  first_sentence: z.string().optional(),
});

export type ParsedOpenLibraryData = z.infer<typeof ParsedOpenLibraryDataSchema>;
