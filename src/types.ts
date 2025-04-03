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

export const AddBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.array(z.string()).optional(),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  categories: z.array(z.string()).optional(),
  colorTag: z.string().optional(),
});

export type AddBookInput = z.infer<typeof AddBookSchema>;
