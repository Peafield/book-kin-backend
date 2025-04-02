import {
  NodeOAuthClient,
  type NodeOAuthClientOptions,
} from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";
import dotenv from "dotenv";
import logger from "../utils/logger";
import { mongoStateStore } from "../stores/MongoStateStore";
import { mongoSessionStore } from "../stores/MongoSessionStore";
import { env } from "../utils/env";

dotenv.config();

let clientInstance: NodeOAuthClient | null = null;

export async function initaliseOAuthClient(): Promise<NodeOAuthClient> {
  if (clientInstance) {
    return clientInstance;
  }
  const clientUri = env.CLIENT_URI;
  const privateKey1 = env.PRIVATE_KEY_1;

  const clientId = `${clientUri}/client-metadata.json`;
  const redirectUri = `${clientUri}/callback`;
  const jwksUri = `${clientUri}/jwks.json`;

  const key1 = await JoseKey.fromImportable(privateKey1, "key1");
  const options: NodeOAuthClientOptions = {
    clientMetadata: {
      client_id: clientId,
      client_name: "Book Kin (dev)",
      client_uri: clientUri,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: "ES256",
      dpop_bound_access_tokens: true,
      jwks_uri: jwksUri,
      scope: "atproto transition:generic",
    },
    keyset: [key1],
    stateStore: mongoStateStore,
    sessionStore: mongoSessionStore,
  };
  clientInstance = new NodeOAuthClient(options);
  logger.info("OAuth Client Initialised");
  return clientInstance;
}

export function getOAuthClient(): NodeOAuthClient {
  if (!clientInstance) {
    throw new Error(
      "OAuth Client not initialised. Call initialiseOAuthClient first."
    );
  }
  return clientInstance;
}
