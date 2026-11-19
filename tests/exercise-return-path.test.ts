import { describe, expect, test } from "bun:test";
import { exerciseReturnPath } from "../lib/exercise-return-path";

describe("exercise return path", () => {
  test("accepts student and admin class detail pages", () => {
    expect(exerciseReturnPath("/classes/class-1")).toBe("/classes/class-1");
    expect(exerciseReturnPath("/admin/classes/class-1")).toBe("/admin/classes/class-1");
  });
  test("defaults invalid, external, and missing destinations to exercises", () => {
    for (const value of [undefined, "//example.com", "https://example.com", "/classes/../profile", "/classes/id?next=//example.com", ["/classes/id"]]) {
      expect(exerciseReturnPath(value)).toBe("/exercises");
    }
  });
});
