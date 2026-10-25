import { describe, expect, test } from "bun:test";
import { avatarInitials, resolveAvatarUrl } from "../lib/avatar";

describe("resolveAvatarUrl", () => {
  test("uses the user's image when set", () => {
    expect(resolveAvatarUrl({ id: "user-1", name: "Ada", image: "https://example.test/ada.png" })).toBe(
      "https://example.test/ada.png",
    );
  });

  test("generates a deterministic DiceBear adventurer avatar seeded by user id", () => {
    const url = resolveAvatarUrl({ id: "user-1", name: "Ada", image: null });
    expect(url).toBe("https://api.dicebear.com/9.x/adventurer/svg?seed=user-1");
    expect(resolveAvatarUrl({ id: "user-1", name: "Ada Lovelace", image: null })).toBe(url);
  });

  test("seeds DiceBear by name when no id is available", () => {
    expect(resolveAvatarUrl({ name: "Ada Lovelace", image: null })).toBe(
      "https://api.dicebear.com/9.x/adventurer/svg?seed=Ada%20Lovelace",
    );
  });

  test("falls back to a generic DiceBear avatar with no id or name", () => {
    expect(resolveAvatarUrl({})).toBe("https://api.dicebear.com/9.x/adventurer/svg?seed=student");
  });
});

describe("avatarInitials", () => {
  test("uses the first letters of the first two name parts", () => {
    expect(avatarInitials("Ada Lovelace")).toBe("AL");
    expect(avatarInitials("Ada")).toBe("A");
    expect(avatarInitials(null)).toBe("?");
  });
});
