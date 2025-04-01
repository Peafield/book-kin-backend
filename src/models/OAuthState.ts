import type { Jwk } from "@atproto/jwk"; // Import Jwk if needed for explicit typing
import mongoose, { Schema, type Document } from "mongoose";

// This interface primarily informs Mongoose. NodeSavedState is the target type.
interface IOAuthStateDocument extends Document {
  key: string;
  pkce: string;
  dpopJwk: Jwk;
  state?: string;
  clientId: string;
  redirectUri?: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  loginHint?: string;
  scope?: string;
  iss: string;
  createdAt: Date;
}

const OAuthStateSchema: Schema = new Schema<IOAuthStateDocument>({
  key: { type: String, required: true, unique: true, index: true },
  pkce: { type: String, required: true },
  dpopJwk: { type: Schema.Types.Mixed, required: true },
  state: { type: String, required: false },
  clientId: { type: String, required: true },
  redirectUri: { type: String, required: false },
  codeChallenge: { type: String, required: true },
  codeChallengeMethod: { type: String, required: true },
  loginHint: { type: String, required: false },
  scope: { type: String, required: false },
  iss: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" },
});

export default mongoose.model<IOAuthStateDocument>(
  "OAuthState",
  OAuthStateSchema
);
