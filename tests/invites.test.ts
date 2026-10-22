import { beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("@/lib/prisma", () => ({ prisma: {} }));
process.env.NEXT_PUBLIC_APP_URL = "https://example.test";

let mod: typeof import("../lib/invites");
beforeAll(async () => {
  mod = await import("../lib/invites");
});

describe("invites", () => {
  test("tokens are unique and only their hash is derivable", () => {
    const a = mod.generateInviteToken();
    const b = mod.generateInviteToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).toBe(mod.hashInviteToken(a.token));
    expect(a.tokenHash).not.toContain(a.token);
  });

  test("status reflects accepted, revoked, expired, pending", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(mod.inviteStatus({ acceptedAt: new Date(), revokedAt: null, expiresAt: future })).toBe("accepted");
    expect(mod.inviteStatus({ acceptedAt: null, revokedAt: new Date(), expiresAt: future })).toBe("revoked");
    expect(mod.inviteStatus({ acceptedAt: null, revokedAt: null, expiresAt: past })).toBe("expired");
    expect(mod.inviteStatus({ acceptedAt: null, revokedAt: null, expiresAt: future })).toBe("pending");
  });

  test("invite url points at sign-up with the token", () => {
    expect(mod.inviteUrl("abc_-")).toBe("https://example.test/sign-up?invite=abc_-");
  });
});
