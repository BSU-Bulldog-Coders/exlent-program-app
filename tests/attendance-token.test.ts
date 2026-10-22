import { beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret";
process.env.ATTENDANCE_TOKEN_SECRET = "attendance-secret-for-tests";

let mod: typeof import("../lib/attendance-token");
beforeAll(async () => {
  mod = await import("../lib/attendance-token");
});

describe("attendance token", () => {
  test("round-trips the class id", () => {
    const { token } = mod.createAttendanceToken("class_123");
    expect(mod.verifyAttendanceToken(token)).toEqual({ ok: true, classId: "class_123" });
  });

  test("expires after the TTL", () => {
    const now = 1_000_000;
    const { token } = mod.createAttendanceToken("c1", now);
    expect(mod.verifyAttendanceToken(token, now + mod.ATTENDANCE_TOKEN_TTL_MS - 1).ok).toBe(true);
    expect(mod.verifyAttendanceToken(token, now + mod.ATTENDANCE_TOKEN_TTL_MS)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  test("rejects a tampered payload (swapped class id)", () => {
    const { token } = mod.createAttendanceToken("class_a");
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ c: "class_b", e: Date.now() + 60_000 }),
    ).toString("base64url");
    expect(mod.verifyAttendanceToken(`${forged}.${signature}`)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  test("rejects garbage", () => {
    for (const value of ["", "abc", "a.b.c", "a.", ".b"]) {
      expect(mod.verifyAttendanceToken(value)).toEqual({ ok: false, reason: "invalid" });
    }
  });
});
