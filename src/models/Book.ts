import mongoose, { type Document, Schema } from "mongoose";

export interface IBook extends Document {
  ownerDid: string;
  status: "available" | "reserved" | "borrowed" | "hidden";
  borrowerDid?: string;
  addedAt: Date;
  updatedAt: Date;
  title: string;
  authors?: string[];
  isbn10?: string;
  isbn13?: string;
  description?: string;
  coverImageUrl?: string;
  publisher?: string;
  publishedDate?: string;
  categories?: string[];
  colorTag?: string;
  openLibraryId?: string;
  googleBooksId?: string;
}

const BookSchema: Schema = new Schema(
  {
    ownerDid: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["available", "reserved", "borrowed", "hidden"],
      default: "available",
      index: true,
    },
    borrowerDid: { type: String, required: false, index: true },
    title: { type: String, required: true, trim: true },
    authors: { type: [String], default: [] },
    isbn10: { type: String, trim: true, sparse: true },
    isbn13: { type: String, trim: true, sparse: true },
    description: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    publisher: { type: String, trim: true },
    publishedDate: { type: String, trim: true },
    categories: { type: [String], default: [] },
    colorTag: { type: String },
    openLibraryId: { type: String, sparse: true },
    googleBooksId: { type: String, sparse: true },
  },
  {
    timestamps: true,
    collection: "books",
    optimisticConcurrency: true,
  }
);

BookSchema.virtual("id").get(function () {
  return (this._id as mongoose.Types.ObjectId).toHexString();
});
BookSchema.set("toJSON", { virtuals: true });
BookSchema.set("toObject", { virtuals: true });

export default mongoose.model<IBook>("Book", BookSchema);
