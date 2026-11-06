import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

type Warning = { userId: string; status: string; class: { startsAt: Date } };

const day = (n: number) => new Date(Date.UTC(2026, 10, n));

const events: string[] = [];
const state: {
  cls: { id: string; status: string; startsAt: Date; attendanceCheckedAt: Date | null } | null;
  attendanceInClass: number;
  newer: { id: string } | null;
  previous: { id: string; startsAt: Date; openedAt: Date | null } | null;
  students: Array<{ id: string; email: string }>;
  warnings: Warning[];
  laterAttendance: Array<{ userId: string; class: { startsAt: Date } }>;
  created: Array<Record<string, unknown>>;
  scheduled: string[];
  checked: boolean;
  studentQuery: Record<string, unknown> | null;
} = {
  cls: null,
  attendanceInClass: 0,
  newer: null,
  previous: null,
  students: [],
  warnings: [],
  laterAttendance: [],
  created: [],
  scheduled: [],
  checked: false,
  studentQuery: null,
};

function reset() {
  events.length = 0;
  state.cls = { id: "c3", status: "CLOSED", startsAt: day(3), attendanceCheckedAt: null };
  state.attendanceInClass = 5;
  state.newer = null;
  state.previous = { id: "c2", startsAt: day(2), openedAt: day(2) };
  state.students = [{ id: "s1", email: "s1@example.test" }];
  state.warnings = [];
  state.laterAttendance = [];
  state.created = [];
  state.scheduled = [];
  state.checked = false;
  state.studentQuery = null;
}

const tx = {
  $executeRaw: mock(async () => {
    events.push("lock");
    return 1;
  }),
  class: {
    findUnique: mock(async () => {
      events.push("read-class");
      return state.cls;
    }),
    findFirst: mock(async ({ where }: { where: { startsAt: { gt?: Date; lt?: Date } } }) =>
      where.startsAt.gt ? state.newer : state.previous,
    ),
    update: mock(async () => {
      state.checked = true;
      return {};
    }),
  },
  attendance: {
    count: mock(async () => state.attendanceInClass),
    findMany: mock(async () => state.laterAttendance),
  },
  user: {
    findMany: mock(async (query: Record<string, unknown>) => {
      state.studentQuery = query;
      return state.students;
    }),
  },
  attendanceWarning: {
    findMany: mock(async () => state.warnings),
    createMany: mock(async ({ data }: { data: Array<Record<string, unknown>> }) => {
      state.created.push(...data);
      return { count: data.length };
    }),
  },
};

const prisma = {
  $transaction: mock(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  class: { findMany: mock(async () => [] as Array<{ id: string; createdById: string }>) },
};

mock.module("server-only", () => ({}));
mock.module("@/lib/attendance-warning-store", () => ({
  prisma,
  scheduleUserDeletionInTx: mock(async (_tx: unknown, _actor: unknown, userId: string) => {
    state.scheduled.push(userId);
    return "scheduled";
  }),
}));

let mod: typeof import("../lib/attendance-warnings");
beforeAll(async () => {
  mod = await import("../lib/attendance-warnings");
});
beforeEach(reset);

describe("planActions", () => {
  const sent = (classDay: number) => ({ status: "SENT" as const, classStartsAt: day(classDay) });

  test("warns a student with no active warning", () => {
    expect(mod.planActions([{ userId: "a", activeWarning: null }], day(2))).toEqual({
      warn: ["a"],
      escalate: [],
      hold: [],
    });
  });

  test("escalates on the third miss: warning class is the previous class or earlier", () => {
    const plan = mod.planActions(
      [
        { userId: "a", activeWarning: sent(2) },
        { userId: "b", activeWarning: sent(1) },
      ],
      day(2),
    );
    expect(plan.escalate).toEqual(["a", "b"]);
  });

  test("does not escalate when the warning is newer than the previous class", () => {
    const plan = mod.planActions([{ userId: "a", activeWarning: sent(3) }], day(2));
    expect(plan).toEqual({ warn: [], escalate: [], hold: ["a"] });
  });

  test("waits until the warning email has actually been sent", () => {
    for (const status of ["PENDING", "PROCESSING"] as const) {
      const plan = mod.planActions([{ userId: "a", activeWarning: { status, classStartsAt: day(1) } }], day(2));
      expect(plan).toEqual({ warn: [], escalate: [], hold: ["a"] });
    }
  });
});

describe("evaluateClassClosure", () => {
  const actor = { id: "admin" };

  test("takes the advisory lock before reading anything, and marks the class checked", async () => {
    const result = await mod.evaluateClassClosure("c3", actor);
    expect(events.slice(0, 2)).toEqual(["lock", "read-class"]);
    expect(state.checked).toBeTrue();
    expect(result).toEqual({ skipped: null, warned: 1, scheduledForDeletion: 0 });
  });

  test("queues one warning per missing student with a per-class idempotency key", async () => {
    state.students = [
      { id: "s1", email: "s1@example.test" },
      { id: "s2", email: "s2@example.test" },
    ];
    await mod.evaluateClassClosure("c3", actor);
    expect(state.created).toEqual([
      {
        userId: "s1",
        classId: "c3",
        previousClassId: "c2",
        recipientEmail: "s1@example.test",
        idempotencyKey: "attendance-warning:s1:c3",
      },
      {
        userId: "s2",
        classId: "c3",
        previousClassId: "c2",
        recipientEmail: "s2@example.test",
        idempotencyKey: "attendance-warning:s2:c3",
      },
    ]);
  });

  test("only considers verified, active students who joined before the previous class", async () => {
    await mod.evaluateClassClosure("c3", actor);
    expect(state.studentQuery?.where).toMatchObject({
      role: "STUDENT",
      emailVerified: true,
      deletionScheduledAt: null,
      createdAt: { lte: day(2) },
      attendances: { none: { classId: { in: ["c3", "c2"] } } },
    });
  });

  test("schedules deletion for a delivered warning on the third miss", async () => {
    state.warnings = [{ userId: "s1", status: "SENT", class: { startsAt: day(2) } }];
    const result = await mod.evaluateClassClosure("c3", actor);
    expect(state.scheduled).toEqual(["s1"]);
    expect(state.created).toEqual([]);
    expect(result).toEqual({ skipped: null, warned: 0, scheduledForDeletion: 1 });
  });

  test("attending a class after the warning clears it, so the student is warned again", async () => {
    state.warnings = [{ userId: "s1", status: "SENT", class: { startsAt: day(1) } }];
    state.laterAttendance = [{ userId: "s1", class: { startsAt: day(2) } }];
    const result = await mod.evaluateClassClosure("c3", actor);
    expect(state.scheduled).toEqual([]);
    expect(result.warned).toBe(1);
  });

  test("an attendance before the warning's class does not clear it", async () => {
    state.warnings = [{ userId: "s1", status: "SENT", class: { startsAt: day(2) } }];
    state.laterAttendance = [{ userId: "s1", class: { startsAt: day(2) } }];
    await mod.evaluateClassClosure("c3", actor);
    expect(state.scheduled).toEqual(["s1"]);
  });

  test("does nothing yet while the warning email is still pending", async () => {
    state.warnings = [{ userId: "s1", status: "PENDING", class: { startsAt: day(2) } }];
    const result = await mod.evaluateClassClosure("c3", actor);
    expect(result).toEqual({ skipped: null, warned: 0, scheduledForDeletion: 0 });
    expect(state.scheduled).toEqual([]);
  });

  test("a class that is not closed is left alone and not marked", async () => {
    state.cls = { id: "c3", status: "OPEN", startsAt: day(3), attendanceCheckedAt: null };
    expect((await mod.evaluateClassClosure("c3", actor)).skipped).toBe("not-closed");
    expect(state.checked).toBeFalse();
  });

  test("a class another evaluator already checked is skipped without redoing the work", async () => {
    state.cls = { id: "c3", status: "CLOSED", startsAt: day(3), attendanceCheckedAt: new Date() };
    expect((await mod.evaluateClassClosure("c3", actor)).skipped).toBe("already-checked");
    expect(state.created).toEqual([]);
    expect(state.checked).toBeFalse();
  });

  test("a class nobody attended is treated as not held and warns no one", async () => {
    state.attendanceInClass = 0;
    const result = await mod.evaluateClassClosure("c3", actor);
    expect(result.skipped).toBe("no-attendance");
    expect(state.created).toEqual([]);
    expect(state.checked).toBeTrue();
  });

  test("closing an older class after a newer one was closed is skipped", async () => {
    state.newer = { id: "c4" };
    expect((await mod.evaluateClassClosure("c3", actor)).skipped).toBe("not-latest");
    expect(state.created).toEqual([]);
  });

  test("the first class has no previous class to compare with", async () => {
    state.previous = null;
    expect((await mod.evaluateClassClosure("c3", actor)).skipped).toBe("no-previous-class");
    expect(state.created).toEqual([]);
  });
});

describe("evaluatePendingClassClosures", () => {
  test("keeps going when one class fails, and reports it", async () => {
    prisma.class.findMany.mockResolvedValueOnce([
      { id: "c1", createdById: "admin" },
      { id: "c3", createdById: "admin" },
    ]);
    let calls = 0;
    prisma.$transaction.mockImplementation(async (callback) => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return callback(tx);
    });
    const result = await mod.evaluatePendingClassClosures();
    expect(result).toEqual({ considered: 2, warned: 1, scheduledForDeletion: 0, failed: 1 });
  });
});
