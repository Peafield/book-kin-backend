import mongoose, { Schema, type Document, type Types } from "mongoose";
import type { ICanonicalBook } from "./CanonicalBook";

export interface IUserLibraryBook extends Document {
  ownerDid: string;
  canonicalBookId: Types.ObjectId;
  status: "available" | "reserved" | "borrowed" | "hidden";
  borrowerDid?: string;
  categories?: string[];
  colorTag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserLibraryBookSchema: Schema = new Schema(
  {
    ownerDid: { type: String, required: true, index: true },
    canonicalBookId: {
      type: Schema.Types.ObjectId,
      ref: "CanonicalBook",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "borrowed", "hidden"],
      default: "available",
      required: true,
      index: true,
    },
    borrowerDid: { type: String, required: false, index: true },
    categories: { type: [String], default: [] },
    colorTag: { type: String, required: false, trim: true },
  },
  {
    timestamps: true,
    collection: "user_library_books",
  }
);

UserLibraryBookSchema.index({ ownerDid: 1, status: 1 });
UserLibraryBookSchema.index(
  { ownerDid: 1, canonicalBookId: 1 },
  { unique: true }
);

UserLibraryBookSchema.virtual("id").get(function () {
  return (this._id as mongoose.Types.ObjectId).toHexString();
});
UserLibraryBookSchema.set("toJSON", { virtuals: true });
UserLibraryBookSchema.set("toObject", { virtuals: true });

export default mongoose.model<IUserLibraryBook>(
  "UserLibraryBook",
  UserLibraryBookSchema
);

export interface IPopulatedUserLibraryBook
  extends Omit<IUserLibraryBook, "canonicalBookId"> {
  canonicalBookId: ICanonicalBook;
}
