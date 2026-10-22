import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

/** How long a scanned token stays valid. The QR on screen refreshes more often. */
export const ATTENDANCE_TOKEN_TTL_MS = 60_000;
export const ATTENDANCE_TOKEN_ROTATE_MS = 30_000;

function secret() {
  return process.env.ATTENDANCE_TOKEN_SECRET ?? requireEnv("BETTER_AUTH_SECRET");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(`attendance:${payload}`).digest("base64url");
}

export function createAttendanceToken(classId: string, now = Date.now()) {
  const expiresAt = now + ATTENDANCE_TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ c: classId, e: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export type TokenResult =
  | { ok: true; classId: string }
  | { ok: false; reason: "invalid" | "expired" };

export function verifyAttendanceToken(token: string, now = Date.now()): TokenResult {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return { ok: false, reason: "invalid" };

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const { c, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof c !== "string" || typeof e !== "number") return { ok: false, reason: "invalid" };
    if (e <= now) return { ok: false, reason: "expired" };
    return { ok: true, classId: c };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
