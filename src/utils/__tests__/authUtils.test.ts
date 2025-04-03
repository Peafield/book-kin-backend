import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import type { AuthRedirectData } from "types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createURLParams, prepareAuthRedirectData } from "../authUtils";
import jwt from "jsonwebtoken";

const testJwtSecret = "test-super-duper-secret-for-testing";

vi.mock("../env", () => ({
  env: {
    JWT_SECRET: "test-super-duper-secret-for-testing",
    APP_BASE_DEEPLINK: "bookkin://callback",
  },
}));

vi.mock("../logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("prepareAuthRedirectData", () => {
  interface MockSessionData {
    did: string | undefined;
  }
  let mockSessionData: MockSessionData;
  let mockProfile: ProfileViewDetailed;

  beforeEach(() => {
    mockSessionData = {
      did: "did:plc:testuser",
    };

    mockProfile = {
      did: "did:plc:testuser",
      handle: "testuser.test",
      displayName: "Test User",
      avatar: "https://example.com/avatar.png",
      description: "A test description.",
      banner: "https://example.com/banner.png",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct AuthRedirectData for valid inputs", () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const result = prepareAuthRedirectData(mockSessionData as any, mockProfile);

    expect(result).not.toBeNull();
    expect(result?.profileData.did).toBe("did:plc:testuser");
    expect(result?.appToken).toBeTypeOf("string");

    if (result?.appToken) {
      try {
        const decoded = jwt.verify(result.appToken, testJwtSecret);
        expect(decoded).toMatchObject({ did: "did:plc:testuser" });
      } catch (e) {
        expect.fail(`JWT verification failed: ${(e as Error).message}`);
      }
    } else {
      expect.fail("appToken was not generated");
    }
  });

  it("should handle missing optional profile fields", () => {
    const minimalProfile: ProfileViewDetailed = {
      ...mockProfile,
      displayName: undefined,
      avatar: undefined,
      description: undefined,
      banner: undefined,
    };
    const result = prepareAuthRedirectData(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      mockSessionData as any,
      minimalProfile
    );
    expect(result).not.toBeNull();
    expect(result?.profileData.displayName).toBeUndefined();
  });

  it("should throw error if session data is missing did", () => {
    const invalidSessionData = { did: undefined };
    const expectedErrorMsg = /Missing session or profile data/i;
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      prepareAuthRedirectData(invalidSessionData as any, mockProfile)
    ).toThrowError(expectedErrorMsg);
  });

  it("should throw error if profile.handle is missing", () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const invalidProfile = { ...mockProfile, handle: undefined as any };
    const expectedErrorMsg = /Missing session or profile data/i;
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      prepareAuthRedirectData(mockSessionData as any, invalidProfile)
    ).toThrowError(expectedErrorMsg);
  });
});

vi.stubEnv("APP_BASE_DEEPLINK", "bookkin://callback");

describe("createURLParams", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("APP_BASE_DEEPLINK", "bookkin://callback");
  });

  it("should create a valid redirect URL with all parameters", () => {
    const testData: AuthRedirectData = {
      appToken: "test-token-123",
      profileData: {
        did: "did:plc:test",
        handle: "test.bsky.social",
        displayName: "Test User",
        avatar: "https://example.com/avatar.jpg",
        description: "Test description",
        banner: "https://example.com/banner.jpg",
      },
    };
    const expectedUrl =
      "bookkin://callback?token=test-token-123&displayName=Test+User&avatar=https%3A%2F%2Fexample.com%2Favatar.jpg&description=Test+description&banner=https%3A%2F%2Fexample.com%2Fbanner.jpg&handle=test.bsky.social&did=did%3Aplc%3Atest";
    const result = createURLParams(testData);

    expect(result).toEqual(expectedUrl);
  });

  it("should return null if redirectData is null", () => {
    expect(() => createURLParams(null)).toThrowError(
      "Missing redirect data from callback"
    );
  });

  it("should create URL correctly if optional profile fields are missing", () => {
    const testData: AuthRedirectData = {
      appToken: "test-token-456",
      profileData: {
        did: "did:plc:test2",
        handle: "test2.bsky.social",
      },
    };

    const expectedUrl =
      "bookkin://callback?token=test-token-456&handle=test2.bsky.social&did=did%3Aplc%3Atest2";
    const result = createURLParams(testData);
    expect(result).toEqual(expectedUrl);
  });
});
