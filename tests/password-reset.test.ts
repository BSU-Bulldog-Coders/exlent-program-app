import { beforeAll, describe, expect, mock, test } from "bun:test";

const state: {
  knownUser: boolean;
  request: { verificationIdentifier: string; expiresAt: Date; outbox: { id: string } } | null;
  verification: { expiresAt: Date } | null;
  outbox: { id: string; status: string; attempts: number; leaseId: string | null } | null;
  createdVerification: Record<string, unknown> | null;
  sent: Array<Record<string, unknown>>;
} = {
  knownUser: true,
  request: null,
  verification: null,
  outbox: null,
  createdVerification: null,
  sent: [],
};

type CreatedResetRequest = {
  id: string;
  verificationIdentifier: string;
  expiresAt: Date;
  outbox: { create: { id: string } };
};

const prisma = {
  user: {
    findUnique: mock(async () => (state.knownUser ? { id: "user-1" } : null)),
    findFirst: mock(async () => (state.knownUser ? { id: "user-1" } : null)),
    findUniqueOrThrow: mock(async () => ({ id: "user-1", email: "student@example.test", name: "Student" })),
  },
  passwordResetRequest: {
    findFirst: mock(async () => state.request),
    create: mock(async ({ data }: { data: CreatedResetRequest }) => {
      const outbox = data.outbox.create;
      state.request = {
        verificationIdentifier: data.verificationIdentifier,
        expiresAt: data.expiresAt,
        outbox: { id: outbox.id },
      };
      state.outbox = { id: outbox.id, status: "PENDING", attempts: 0, leaseId: null };
      return { id: data.id };
    }),
  },
  verification: {
    findFirst: mock(async () => state.verification),
    create: mock(async ({ data }: { data: Record<string, unknown> }) => {
      state.createdVerification = data;
      state.verification = { expiresAt: data.expiresAt as Date };
      return data;
    }),
  },
  emailOutbox: {
    updateMany: mock(async ({ data }: { data: Record<string, unknown> }) => {
      if (!state.outbox) return { count: 0 };
      if (data.status === "ABANDONED") return { count: 0 };
      if (data.status === "PROCESSING") {
        if (state.outbox.status !== "PENDING") return { count: 0 };
        state.outbox.status = "PROCESSING";
        state.outbox.attempts += 1;
        state.outbox.leaseId = typeof data.leaseId === "string" ? data.leaseId : null;
        return { count: 1 };
      }
      if (data.status === "SENT") {
        state.outbox.status = "SENT";
        state.outbox.leaseId = null;
        return { count: 1 };
      }
      return { count: 0 };
    }),
    findFirst: mock(async () => {
      if (!state.outbox || state.outbox.status !== "PROCESSING") return null;
      return {
        id: state.outbox.id,
        kind: "PASSWORD_RESET",
        to: "student@example.test",
        payload: { name: "Student", url: "https://example.test/reset-password?token=token" },
        idempotencyKey: `password-reset:${state.outbox.id}`,
        attempts: state.outbox.attempts,
        leaseId: state.outbox.leaseId,
      };
    }),
  },
  $queryRaw: mock(async () => []),
  $transaction: mock(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)),
};

mock.module("server-only", () => ({}));
mock.module("@/generated/prisma/client", () => ({
  EmailOutboxStatus: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SENT: "SENT",
    ABANDONED: "ABANDONED",
  },
}));
mock.module("@/lib/prisma", () => ({ prisma }));
mock.module("@/lib/env", () => ({ appUrl: () => "https://example.test" }));
mock.module("@/lib/email", () => ({
  sendPasswordResetEmail: mock(async (args: Record<string, unknown>) => {
    state.sent.push(args);
  }),
}));

let passwordReset: typeof import("../lib/password-reset");
beforeAll(async () => {
  passwordReset = await import("../lib/password-reset");
});

describe("password reset issuance", () => {
  test("uses a 24-hour token lifetime and bounded exponential retries", () => {
    expect(passwordReset.PASSWORD_RESET_TTL_MS).toBe(24 * 60 * 60 * 1000);
    expect(passwordReset.emailRetryDelayMs(1)).toBe(60_000);
    expect(passwordReset.emailRetryDelayMs(2)).toBe(120_000);
    expect(passwordReset.emailRetryDelayMs(99)).toBe(60 * 60 * 1000);
  });

  test("returns the neutral outcome for an unknown address without an email event", async () => {
    state.knownUser = false;
    const result = await passwordReset.requestPasswordReset({ email: "missing@example.test" });
    state.knownUser = true;

    expect(result).toBe("ignored");
    expect(state.outbox).toBeNull();
    expect(state.sent).toHaveLength(0);
  });

  test("creates one verification/outbox pair and reuses an active request", async () => {
    const first = await passwordReset.requestPasswordReset({ email: "STUDENT@example.test" });
    const second = await passwordReset.requestPasswordReset({ email: "student@example.test" });

    expect(first).toBe("created");
    expect(second).toBe("active");
    expect(state.createdVerification?.identifier).toMatch(/^reset-password:/);
    expect(state.request?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0]?.idempotencyKey).toBe(`password-reset:${state.outbox?.id}`);
  });
});
