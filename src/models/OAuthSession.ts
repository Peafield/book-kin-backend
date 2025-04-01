import type { Jwk } from "@atproto/jwk";
import type { TokenSet } from "@atproto/oauth-client-node";
import mongoose, { Schema, type Document } from "mongoose";

interface IOAuthSessionDocument extends Document {
  sub: string;
  dpopJwk: Jwk;
  tokenSet: TokenSet;
  createdAt?: Date;
}

const OAuthSessionSchema: Schema = new Schema<IOAuthSessionDocument>({
  sub: { type: String, required: true, unique: true, index: true },
  dpopJwk: { type: Schema.Types.Mixed, required: true },
  tokenSet: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Use the specific Document interface for the model
export default mongoose.model<IOAuthSessionDocument>(
  "OAuthSession",
  OAuthSessionSchema
);
