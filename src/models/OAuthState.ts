import mongoose, { Schema, type Document } from "mongoose";
import type { NodeSavedState } from "@atproto/oauth-client-node";

interface IOAuthState extends NodeSavedState, Document {
  key: string;
  createdAt: Date;
}

const OAuthStateSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  pkce: { type: String, required: true },
  dpopKey: { type: Schema.Types.Mixed, required: true },
  state: { type: String, required: false },
  clientId: { type: String, required: true },
  redirectUri: { type: String, required: false },
  codeChallenge: { type: String, required: true },
  codeChallengeMethod: { type: String, required: true },
  loginHint: { type: String, required: false },
  scope: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, expires: "1h" },
});

export default mongoose.model<IOAuthState>("OAuthState", OAuthStateSchema);
