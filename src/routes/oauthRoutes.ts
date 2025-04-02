import { Agent } from "@atproto/api";
import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import { OAuthCallbackError } from "@atproto/oauth-client-node";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import logger from "../utils/logger";
import { createURLParams, prepareAuthRedirectData } from "../utils/authUtils";
import { env } from "../utils/env";

const APP_BASE_DEEPLINK = env.APP_BASE_DEEPLINK;

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

        const { session } = await client.callback(params);

        logger.info("Callback successful!");

        const agent = new Agent(session);
        const profileResult = await agent.getProfile({ actor: session.did });

        if (!profileResult.success || !profileResult.data) {
          logger.error(
            `Failed to fetch profile data after callback: ${profileResult}`
          );
        }

        const profile = profileResult.data;
        logger.info(`Workspace profile for ${profile.handle}`);

        const redirectData = prepareAuthRedirectData(session, profile);
        if (!redirectData) {
          logger.error("Failed to prepare auth redirect data");
          return res
            .status(500)
            .redirect(`${APP_BASE_DEEPLINK}?error=data_preparation_failed`);
        }

        const redirectUrl = createURLParams(redirectData);
        if (!redirectUrl) {
          logger.error("Failed to create redirect URL");
          return res
            .status(500)
            .redirect(`${APP_BASE_DEEPLINK}?error=url_preparation_failed`);
        }

        logger.info(`Redirecting to: ${redirectUrl}`);
        res.redirect(redirectUrl);
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
