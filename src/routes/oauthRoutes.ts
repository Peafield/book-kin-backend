import { Agent } from "@atproto/api";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { OAuthCallbackError } from "@atproto/oauth-client-node";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import logger from "../utils/logger";

export function createOAuthRouter(client: NodeOAuthClient): Router {
  const router = Router();

  // --- OAuth Metadata Endpoints ---
  router.get("/client-metadata.json", (req: Request, res: Response) => {
    res.json(client.clientMetadata);
  });

  router.get("/jwks.json", (req: Request, res: Response) => {
    res.json(client.jwks);
  });

  // --- OAuth Flow Endpoints ---
  router.get("/login", (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      try {
        const handle =
          (req.query.handle as string) || "your-test-handle.bsky.social";
        if (!handle) {
          return res.status(400).send("Handle query parameter is required");
        }
        const state = Math.random().toString(36).substring(2);
        logger.info(
          `Initiating login for handle: ${handle} with state: ${state}`
        );

        const ac = new AbortController();
        req.on("close", () => ac.abort());

        const authorizationUrl = await client.authorize(handle, {
          state: state,
          signal: ac.signal,
        });

        logger.info(`Redirecting to: ${authorizationUrl}`);
        res.redirect(`${authorizationUrl}`);
      } catch (error) {
        logger.error("Login initiation error:", error);
        next(error);
      }
    })();
  });

  router.get("/callback", (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      logger.info("Received callback request:", req.url);
      try {
        const params = new URLSearchParams(req.url.split("?")[1]);
        if (!params.get("code") || !params.get("state")) {
          return res.status(400).send("Missing code or state in callback");
        }
        logger.info(
          `Callback params - Code: ${params.get("code")}, State: ${params.get(
            "state"
          )}, Iss: ${params.get("iss")}`
        );

        const { session, state: returnedState } = await client.callback(params);

        logger.info(`Callback successful! Returned state: ${returnedState}`);
        logger.info("User authenticated DID:", session.did);

        const agent = new Agent(session);
        const profile = await agent.getProfile({ actor: session.did });
        logger.info(`Workspaceed profile for ${profile.data.handle}`);

        res.json({
          message: "Authentication successful!",
          did: session.did,
          handle: profile.data.handle,
        });
      } catch (error) {
        logger.error("OAuth Callback Error:", error);
        if (error instanceof OAuthCallbackError) {
          logger.error(
            "OAuth Specific Error Details:",
            error.message,
            error.params.toString()
          );
        }
        next(error);
      }
    })();
  });

  return router;
}
