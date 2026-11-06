import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const state: {
  status: string;
  attempts: number;
  leaseId: string | null;
  lastError: string | null;
  cleared: boolean;
  sent: Array<Record<string, unknown>>;
  fail: boolean;
} = { status: "PENDING", attempts: 0, leaseId: null, lastError: null, cleared: false, sent: [], fail: false };

function reset() {
  Object.assign(state, {
    status: "PENDING",
    attempts: 0,
    leaseId: null,
    lastError: null,
    cleared: false,
    sent: [],
    fail: false,
  });
}

const prisma = {
  attendanceWarning: {
    updateMany: mock(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      if (data.status === "PROCESSING") {
        // claim: only due, uncleared warnings
        if (state.cleared || state.status !== "PENDING") return { count: 0 };
        state.status = "PROCESSING";
        state.attempts += 1;
        state.leaseId = data.leaseId as string;
        return { count: 1 };
      }
      if (where.leaseId !== state.leaseId) return { count: 0 };
      state.status = data.status as string;
      state.leaseId = null;
      state.lastError = (data.lastError as string | null) ?? null;
      return { count: 1 };
    }),
    findFirst: mock(async () => ({
      id: "w1",
      recipientEmail: "s1@example.test",
      idempotencyKey: "attendance-warning:s1:c3",
      attempts: state.attempts,
      leaseId: state.leaseId,
      user: { name: "Student One" },
      class: { name: "Class 3" },
      previousClass: { name: "Class 2" },
    })),
    findMany: mock(async () => (state.status === "PENDING" && !state.cleared ? [{ id: "w1" }] : [])),
  },
};

mock.module("server-only", () => ({}));
mock.module("@/lib/attendance-warning-delivery-store", () => ({ prisma }));
mock.module("@/lib/env", () => ({ appUrl: () => "https://example.test" }));
mock.module("@/lib/attendance-warning-email", () => ({
  sendQueuedAttendanceWarningEmail: mock(async (input: Record<string, unknown>) => {
    if (state.fail) throw new Error("provider down");
    state.sent.push(input);
  }),
}));

let delivery: typeof import("../lib/attendance-warning-delivery");
beforeAll(async () => {
  delivery = await import("../lib/attendance-warning-delivery");
});
beforeEach(reset);

describe("attendance warning delivery", () => {
  test("sends once with the warning's idempotency key and marks it SENT", async () => {
    expect(await delivery.deliverAttendanceWarning("w1")).toEqual({ delivered: true });
    expect(state.status).toBe("SENT");
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0]).toMatchObject({
      to: "s1@example.test",
      name: "Student One",
      className: "Class 3",
      previousClassName: "Class 2",
      idempotencyKey: "attendance-warning:s1:c3",
    });
  });

  test("a second worker cannot claim a warning that is already being delivered", async () => {
    state.status = "PROCESSING";
    expect(await delivery.deliverAttendanceWarning("w1")).toEqual({ delivered: false });
    expect(state.sent).toHaveLength(0);
  });

  test("a failure goes back to PENDING for retry and keeps the error", async () => {
    state.fail = true;
    expect(await delivery.deliverAttendanceWarning("w1")).toEqual({ delivered: false });
    expect(state.status).toBe("PENDING");
    expect(state.lastError).toContain("provider down");
  });

  test("gives up as FAILED after the last attempt", async () => {
    state.fail = true;
    state.attempts = 4; // the claim makes this the 5th
    await delivery.deliverAttendanceWarning("w1");
    expect(state.status).toBe("FAILED");
  });

  test("a warning cleared before delivery is never emailed", async () => {
    state.cleared = true;
    expect(await delivery.deliverDueAttendanceWarnings()).toEqual({ claimed: 0, delivered: 0 });
    expect(await delivery.deliverAttendanceWarning("w1")).toEqual({ delivered: false });
    expect(state.sent).toHaveLength(0);
  });

  test("the due worker delivers pending warnings", async () => {
    expect(await delivery.deliverDueAttendanceWarnings()).toEqual({ claimed: 1, delivered: 1 });
  });
});
