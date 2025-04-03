import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import type { OAuthSession } from "@atproto/oauth-client-node";
import jwt from "jsonwebtoken";
import type { AppUserProfile, AuthRedirectData } from "types";
import { env } from "./env";
import logger from "./logger";

const APP_BASE_DEEPLINK = env.APP_BASE_DEEPLINK;

export function prepareAuthRedirectData(
  session: OAuthSession,
  profile: ProfileViewDetailed
): AuthRedirectData | null {
  if (!session?.did || !profile?.handle) {
    logger.error("Session or pofile data missing required fields (did/handle)");
    throw new Error(
      "Auth Redirect Data Preperation Error: Missing session or profile data"
    );
  }

  const JWT_SECRET = env.JWT_SECRET;

  const profileData: AppUserProfile = {
    did: session.did,
    handle: profile.handle,
    displayName: profile.displayName,
    avatar: profile.avatar,
    description: profile.description,
    banner: profile.banner,
  };

  const appTokenPayload = { did: session.did };
  const appToken = jwt.sign(appTokenPayload, JWT_SECRET, { expiresIn: "7d" });

  return { appToken, profileData };
}

export function createURLParams(
  redirectData: AuthRedirectData | null
): string | null {
  if (!redirectData) {
    logger.error("Missing redirect data from callback");
    throw new Error("Missing redirect data from callback");
  }

  const redirectParams = new URLSearchParams();
  redirectParams.append("token", redirectData.appToken);

  if (redirectData.profileData.displayName)
    redirectParams.append("displayName", redirectData.profileData.displayName);
  if (redirectData.profileData.avatar)
    redirectParams.append("avatar", redirectData.profileData.avatar);
  if (redirectData.profileData.description)
    redirectParams.append("description", redirectData.profileData.description);
  if (redirectData.profileData.banner)
    redirectParams.append("banner", redirectData.profileData.banner);
  if (redirectData.profileData.handle)
    redirectParams.append("handle", redirectData.profileData.handle);
  if (redirectData.profileData.did)
    redirectParams.append("did", redirectData.profileData.did);

  const redirectUrl = `${APP_BASE_DEEPLINK}?${redirectParams.toString()}`;
  return redirectUrl;
}
