import mongoose, { Schema, type Document } from "mongoose";

export interface ICanonicalBook extends Document {
  title: string;
  authors?: string[];
  isbn10?: string;
  isbn13?: string;
  description?: string;
  coverImageUrl?: string;
  publisher?: string;
  publishedDate?: string;
  openLibraryId?: string;
  googleBooksId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CanonicalBookSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    authors: { type: [String], default: [] },
    isbn10: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    isbn13: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    description: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    publisher: { type: String, trim: true },
    publishedDate: { type: String, trim: true },
    openLibraryId: { type: String, unique: true, sparse: true, index: true },
    googleBooksId: { type: String, unique: true, sparse: true, index: true },
  },
  {
    timestamps: true,
    collection: "canonical_books",
  }
);

CanonicalBookSchema.virtual("id").get(function () {
  return (this._id as mongoose.Types.ObjectId).toHexString();
});
CanonicalBookSchema.set("toJSON", { virtuals: true });
CanonicalBookSchema.set("toObject", { virtuals: true });

export default mongoose.model<ICanonicalBook>(
  "CanonicalBook",
  CanonicalBookSchema
);
