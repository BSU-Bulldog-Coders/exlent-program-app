import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

type User = {
  id: string;
  role: "ADMIN" | "STUDENT";
  deletionScheduledAt: Date | null;
  deletionDueAt: Date | null;
};

const state: {
  users: Map<string, User>;
  sessions: Set<string>;
  accounts: Set<string>;
  classes: Array<{ createdById: string }>;
  announcements: Array<{ authorId: string }>;
  warnings: Array<{ userId: string; clearedAt: Date | null }>;
} = {
  users: new Map(),
  sessions: new Set(),
  accounts: new Set(),
  classes: [],
  announcements: [],
  warnings: [],
};

function reset(users: User[]) {
  state.users = new Map(users.map((user) => [user.id, { ...user }]));
  state.sessions = new Set(users.map((user) => user.id));
  state.accounts = new Set(users.map((user) => user.id));
  state.classes = [];
  state.announcements = [];
  state.warnings = [];
}

const prisma = {
  user: {
    findUnique: mock(async ({ where }: { where: { id: string } }) => state.users.get(where.id) ?? null),
    count: mock(async ({ where }: { where: { role: "ADMIN"; deletionScheduledAt: null } }) =>
      [...state.users.values()].filter((user) => user.role === where.role && user.deletionScheduledAt === null).length,
    ),
    update: mock(async ({ where, data }: { where: { id: string }; data: Partial<User> }) => {
      const user = state.users.get(where.id);
      if (!user) throw new Error("missing user");
      Object.assign(user, data);
      return user;
    }),
    deleteMany: mock(async ({ where }: { where: { id: string } }) => {
      const user = state.users.get(where.id);
      if (!user) return { count: 0 };
      state.users.delete(where.id);
      state.sessions.delete(where.id);
      state.accounts.delete(where.id);
      return { count: 1 };
    }),
    findMany: mock(async ({ where }: { where: { deletionDueAt: { lte: Date } } }) =>
      [...state.users.values()]
        .filter((user) => user.deletionDueAt && user.deletionDueAt <= where.deletionDueAt.lte)
        .map((user) => ({ id: user.id })),
    ),
  },
  session: {
    deleteMany: mock(async ({ where }: { where: { userId: string } }) => {
      state.sessions.delete(where.userId);
      return { count: 1 };
    }),
  },
  class: {
    updateMany: mock(async ({ where, data }: { where: { createdById: string }; data: { createdById: string } }) => {
      for (const item of state.classes) if (item.createdById === where.createdById) item.createdById = data.createdById;
      return { count: 0 };
    }),
  },
  announcement: {
    updateMany: mock(async ({ where, data }: { where: { authorId: string }; data: { authorId: string } }) => {
      for (const item of state.announcements) if (item.authorId === where.authorId) item.authorId = data.authorId;
      return { count: 0 };
    }),
  },
  attendanceWarning: {
    updateMany: mock(async ({ where }: { where: { userId: string; clearedAt: null } }) => {
      let count = 0;
      for (const warning of state.warnings) {
        if (warning.userId === where.userId && warning.clearedAt === null) {
          warning.clearedAt = new Date();
          count += 1;
        }
      }
      return { count };
    }),
  },
  $queryRaw: mock(async () => []),
  $transaction: mock(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)),
};

mock.module("server-only", () => ({}));
mock.module("@/lib/prisma", () => ({ prisma }));

let deletion: typeof import("../lib/user-deletion");
beforeAll(async () => {
  deletion = await import("../lib/user-deletion");
});

beforeEach(() => {
  reset([
    { id: "admin-a", role: "ADMIN", deletionScheduledAt: null, deletionDueAt: null },
    { id: "admin-b", role: "ADMIN", deletionScheduledAt: null, deletionDueAt: null },
    { id: "student", role: "STUDENT", deletionScheduledAt: null, deletionDueAt: null },
  ]);
});

describe("scheduled user deletion", () => {
  test("uses a 30-day due date, transfers ownership, and revokes sessions", async () => {
    state.classes = [{ createdById: "admin-b" }];
    state.announcements = [{ authorId: "admin-b" }];
    const before = Date.now();

    expect(await deletion.scheduleUserDeletion({ id: "admin-a" }, "admin-b")).toBe("scheduled");

    const target = state.users.get("admin-b");
    expect(target?.deletionScheduledAt).not.toBeNull();
    expect(target?.deletionDueAt?.getTime()).toBeGreaterThanOrEqual(before + deletion.ACCOUNT_DELETION_DELAY_MS);
    expect(state.sessions.has("admin-b")).toBeFalse();
    expect(state.classes[0]?.createdById).toBe("admin-a");
    expect(state.announcements[0]?.authorId).toBe("admin-a");
  });

  test("protects self, the final active administrator, and an already scheduled account", async () => {
    expect(await deletion.scheduleUserDeletion({ id: "admin-a" }, "admin-a")).toBe("cannot-delete-self");

    reset([
      { id: "admin-a", role: "ADMIN", deletionScheduledAt: null, deletionDueAt: null },
      { id: "student", role: "STUDENT", deletionScheduledAt: null, deletionDueAt: null },
    ]);
    expect(await deletion.scheduleUserDeletion({ id: "student" }, "admin-a")).toBe("last-admin");

    reset([
      { id: "admin-a", role: "ADMIN", deletionScheduledAt: null, deletionDueAt: null },
      { id: "student", role: "STUDENT", deletionScheduledAt: new Date(), deletionDueAt: new Date() },
    ]);
    expect(await deletion.scheduleUserDeletion({ id: "admin-a" }, "student")).toBe("already-scheduled");
  });

  test("undo also clears the student's missed-classes warnings", async () => {
    state.warnings = [
      { userId: "student", clearedAt: null },
      { userId: "other", clearedAt: null },
    ];
    await deletion.scheduleUserDeletion({ id: "admin-a" }, "student");
    expect(await deletion.undoUserDeletion("student")).toBe("undone");
    expect(state.warnings[0]?.clearedAt).not.toBeNull();
    expect(state.warnings[1]?.clearedAt).toBeNull();
  });

  test("undo clears the schedule without restoring sessions", async () => {
    await deletion.scheduleUserDeletion({ id: "admin-a" }, "student");
    expect(await deletion.undoUserDeletion("student")).toBe("undone");
    expect(state.users.get("student")?.deletionDueAt).toBeNull();
    expect(state.sessions.has("student")).toBeFalse();
  });

  test("cron ignores accounts before their due time", async () => {
    await deletion.scheduleUserDeletion({ id: "admin-a" }, "student");
    expect(await deletion.purgeDueUserDeletions()).toEqual({ considered: 0, deleted: 0 });
    expect(state.users.has("student")).toBeTrue();
  });

  test("delete now and cron safely race on the same due account", async () => {
    const student = state.users.get("student");
    if (!student) throw new Error("test setup failed");
    student.deletionScheduledAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    student.deletionDueAt = new Date(Date.now() - 1);

    const [immediate, cron] = await Promise.all([
      deletion.deleteUserNow("student"),
      deletion.purgeDueUserDeletions(),
    ]);

    expect([immediate, cron.deleted === 1 ? "deleted" : "not-found"]).toContain("deleted");
    expect(state.users.has("student")).toBeFalse();
    expect(state.accounts.has("student")).toBeFalse();
    expect(state.sessions.has("student")).toBeFalse();
  });
});
