import { describe, it, expect } from "vitest";
import { cleanIsbn } from "../cleanIsbn";

describe("cleanIsbn", () => {
  it("should remove hyphens and trim whitespace from a valid ISBN", () => {
    const result = cleanIsbn(" 978-3-16-148410-0 ");
    expect(result).toBe("9783161484100");
  });

  it("should return undefined for an undefined input", () => {
    const result = cleanIsbn(undefined);
    expect(result).toBeUndefined();
  });

  it("should return undefined for a null input", () => {
    const result = cleanIsbn(null);
    expect(result).toBeUndefined();
  });

  it("should return undefined for an empty string", () => {
    const result = cleanIsbn("");
    expect(result).toBeUndefined();
  });

  it("should return the same string if there are no hyphens or extra spaces", () => {
    const result = cleanIsbn("9783161484100");
    expect(result).toBe("9783161484100");
  });

  it("should handle strings with only whitespace and return undefined", () => {
    const result = cleanIsbn("   ");
    expect(result).toBeUndefined();
  });
});
