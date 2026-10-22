import { describe, expect, test } from "bun:test";
import { formatDateTime, isValidTimeZone, percent } from "../lib/format";

describe("formatDateTime", () => {
  // 23:30 UTC is already the next day in Lagos (UTC+1).
  const instant = new Date("2026-03-10T23:30:00Z");

  test("renders the same instant in the class timezone", () => {
    expect(formatDateTime(instant, "UTC")).toContain("Mar 10, 2026");
    expect(formatDateTime(instant, "Africa/Lagos")).toContain("Mar 11, 2026");
  });
});

describe("isValidTimeZone", () => {
  test("accepts IANA zones and rejects junk", () => {
    expect(isValidTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
  });
});

describe("percent", () => {
  test("rounds and guards divide-by-zero", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBeNull();
  });
});
