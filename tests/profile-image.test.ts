import { describe, expect, test } from "bun:test";
import { parseProfileImageUrl } from "../lib/profile-image";

describe("parseProfileImageUrl", () => {
  test("accepts an https URL, trimmed", () => {
    expect(parseProfileImageUrl("  https://example.test/ada.png  ")).toBe("https://example.test/ada.png");
  });

  test("blank, null, and undefined all clear the image", () => {
    expect(parseProfileImageUrl("")).toBe(null);
    expect(parseProfileImageUrl("   ")).toBe(null);
    expect(parseProfileImageUrl(null)).toBe(null);
    expect(parseProfileImageUrl(undefined)).toBe(null);
  });

  test("rejects non-http(s) URLs and invalid URLs", () => {
    expect(parseProfileImageUrl("javascript:alert(1)")).toEqual({
      error: "Profile image URL must start with http:// or https://.",
    });
    expect(parseProfileImageUrl("not a url")).toEqual({
      error: "Enter a valid profile image URL, or leave it blank.",
    });
  });

  test("rejects URLs over 500 characters", () => {
    expect(parseProfileImageUrl(`https://example.test/${"a".repeat(600)}`)).toEqual({
      error: "Profile image URL is too long.",
    });
  });
});
