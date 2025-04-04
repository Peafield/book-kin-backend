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
