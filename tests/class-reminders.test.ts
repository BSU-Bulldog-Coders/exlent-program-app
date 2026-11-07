import { beforeAll, describe, expect, mock, test } from "bun:test";

type Where = Record<string, unknown>;
const sent: Record<string, unknown>[] = [];
const created: { data: Record<string, unknown>[]; skipDuplicates?: boolean }[] = [];
let userWhere: Where | null = null;
let classStatus = "OPEN";
let state = { status: "PENDING", fail: false };

const prisma = {
  classReminder: {
    updateMany: mock(async (args: { data: { status?: string }; where: { status?: unknown } }) => {
      if (args.data.status === "PROCESSING") return { count: 1 };
      if (args.data.status) state.status = args.data.status;
      return { count: 1 };
    }),
    findFirst: mock(async () => ({
      id: "r1",
      recipientEmail: "s@example.test",
      idempotencyKey: "class-reminder:s1:c1",
      attempts: 1,
      leaseId: "lease",
      user: { name: "Sam" },
      class: { id: "c1", name: "Intro", status: classStatus, startsAt: new Date("2026-11-10T15:00:00Z"), timezone: "America/New_York" },
    })),
    createMany: mock(async (args: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => {
      created.push(args);
      return { count: args.data.length };
    }),
  },
};

mock.module("server-only", () => ({}));
mock.module("@/lib/prisma", () => ({ prisma }));
mock.module("@/lib/env", () => ({ appUrl: () => "https://example.test" }));
mock.module("@/lib/class-reminder-email", () => ({
  sendQueuedClassReminderEmail: mock(async (input: Record<string, unknown>) => {
    if (state.fail) throw new Error("provider down");
    sent.push(input);
  }),
}));

let reminders: typeof import("../lib/class-reminders");
beforeAll(async () => {
  reminders = await import("../lib/class-reminders");
});

describe("queueClassReminders", () => {
  const tx = {
    user: {
      findMany: mock(async (args: { where: Where }) => {
        userWhere = args.where;
        return [{ id: "s1", email: "s1@example.test" }, { id: "s2", email: "s2@example.test" }];
      }),
    },
    classReminder: prisma.classReminder,
  };

  test("targets only verified, non-deleting students and queues one idempotent row each", async () => {
    const count = await reminders.queueClassReminders(tx as never, "c1");
    expect(userWhere).toEqual({ role: "STUDENT", emailVerified: true, deletionScheduledAt: null });
    expect(count).toBe(2);
    expect(created[0].skipDuplicates).toBe(true);
    expect(created[0].data.map((row) => row.idempotencyKey)).toEqual([
      "class-reminder:s1:c1",
      "class-reminder:s2:c1",
    ]);
  });
});

describe("deliverClassReminder", () => {
  test("sends the email with the class time in its timezone and a link to the class", async () => {
    const result = await reminders.deliverClassReminder("r1");
    expect(result.delivered).toBe(true);
    expect(sent[0]).toMatchObject({
      to: "s@example.test",
      name: "Sam",
      className: "Intro",
      url: "https://example.test/classes/c1",
      idempotencyKey: "class-reminder:s1:c1",
    });
    expect(String(sent[0].startsAt)).toContain("10:00");
    expect(state.status).toBe("SENT");
  });

  test("does not email for a class that was closed before delivery", async () => {
    sent.length = 0;
    classStatus = "CLOSED";
    const result = await reminders.deliverClassReminder("r1");
    expect(result.delivered).toBe(false);
    expect(sent).toHaveLength(0);
    expect(state.status).toBe("FAILED");
    classStatus = "OPEN";
  });

  test("a provider failure goes back to PENDING for retry", async () => {
    state = { status: "PENDING", fail: true };
    const result = await reminders.deliverClassReminder("r1");
    expect(result.delivered).toBe(false);
    expect(state.status).toBe("PENDING");
  });
});
