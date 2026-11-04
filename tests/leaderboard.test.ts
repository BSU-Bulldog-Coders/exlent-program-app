import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

type Adjustment = { idempotencyKey: string; userId: string; adminId: string; delta: number; resultingScore: number };

const state: { scores: Map<string, number>; adjustments: Map<string, Adjustment>; rows: unknown[] } = {
  scores: new Map(),
  adjustments: new Map(),
  rows: [],
};

const tx = {
  scoreAdjustment: {
    createMany: mock(async ({ data }: { data: Adjustment[] }) => {
      let count = 0;
      for (const row of data) {
        if (state.adjustments.has(row.idempotencyKey)) continue;
        state.adjustments.set(row.idempotencyKey, { ...row });
        count++;
      }
      return { count };
    }),
    findUnique: mock(async ({ where }: { where: { idempotencyKey: string } }) => state.adjustments.get(where.idempotencyKey) ?? null),
    update: mock(async ({ where, data }: { where: { idempotencyKey: string }; data: { resultingScore: number } }) => {
      Object.assign(state.adjustments.get(where.idempotencyKey)!, data);
    }),
  },
  // Mirrors the clamped UPDATE ... RETURNING and the leaderboard SELECT.
  $queryRaw: mock(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (strings.join("?").includes("UPDATE")) {
      const [max, delta, userId] = values as [number, number, string];
      const current = state.scores.get(userId);
      if (current === undefined) return [];
      const next = Math.min(max, Math.max(0, current + delta));
      state.scores.set(userId, next);
      return [{ score: next }];
    }
    return state.rows;
  }),
};

const prisma = {
  ...tx,
  user: { count: mock(async () => 3) },
  $transaction: mock(async (fn: (t: typeof tx) => Promise<unknown>) => {
    // Roll back the in-memory state if the callback throws, like a real transaction.
    const adjustments = new Map([...state.adjustments].map(([k, v]) => [k, { ...v }]));
    try {
      return await fn(tx);
    } catch (error) {
      state.adjustments = adjustments;
      throw error;
    }
  }),
};

mock.module("server-only", () => ({}));
mock.module("@/lib/prisma", () => ({ prisma }));

let lb: typeof import("../lib/leaderboard");
beforeAll(async () => {
  lb = await import("../lib/leaderboard");
});

beforeEach(() => {
  state.scores = new Map([["s1", 10]]);
  state.adjustments = new Map();
  state.rows = [];
});

const base = { userId: "s1", adminId: "a1" };

describe("adjustScore", () => {
  test("applies a change and returns the new score", async () => {
    const result = await lb.adjustScore({ ...base, delta: 5, idempotencyKey: "k1" });
    expect(result).toEqual({ score: 15, replayed: false });
  });

  test("the same key applied twice changes the score once", async () => {
    await lb.adjustScore({ ...base, delta: 5, idempotencyKey: "k1" });
    const again = await lb.adjustScore({ ...base, delta: 5, idempotencyKey: "k1" });
    expect(again).toEqual({ score: 15, replayed: true });
    expect(state.scores.get("s1")).toBe(15);
  });

  test("concurrent duplicates of one key apply once", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => lb.adjustScore({ ...base, delta: 3, idempotencyKey: "same" })),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect(state.scores.get("s1")).toBe(13);
  });

  test("different keys both apply", async () => {
    await lb.adjustScore({ ...base, delta: 5, idempotencyKey: "k1" });
    await lb.adjustScore({ ...base, delta: 5, idempotencyKey: "k2" });
    expect(state.scores.get("s1")).toBe(20);
  });

  test("a key reused for a different change is rejected", async () => {
    await lb.adjustScore({ ...base, delta: 5, idempotencyKey: "k1" });
    await expect(lb.adjustScore({ ...base, delta: 6, idempotencyKey: "k1" })).rejects.toThrow("different change");
    expect(state.scores.get("s1")).toBe(15);
  });

  test("clamps at 0 and 32767", async () => {
    expect((await lb.adjustScore({ ...base, delta: -100, idempotencyKey: "low" })).score).toBe(0);
    expect((await lb.adjustScore({ ...base, delta: 32767, idempotencyKey: "high1" })).score).toBe(32767);
    expect((await lb.adjustScore({ ...base, delta: 50, idempotencyKey: "high2" })).score).toBe(32767);
  });

  test("an unknown student fails and does not consume the key", async () => {
    await expect(lb.adjustScore({ userId: "nope", adminId: "a1", delta: 1, idempotencyKey: "k9" })).rejects.toThrow("not found");
    expect(state.adjustments.has("k9")).toBe(false);
  });

  test("rejects zero, fractional and oversized deltas", async () => {
    for (const delta of [0, 1.5, 40000]) {
      await expect(lb.adjustScore({ ...base, delta, idempotencyKey: `bad-${delta}` })).rejects.toThrow();
    }
  });
});

describe("getLeaderboard", () => {
  test("maps rows to name, image, score and position", async () => {
    state.rows = [
      { id: "a", name: "Ada", image: "https://img/a.png", score: 9, position: BigInt(1) },
      { id: "b", name: "Ben", image: null, score: 5, position: BigInt(2) },
      { id: "c", name: "Cleo", image: null, score: 5, position: BigInt(2) },
    ];
    const { entries, total } = await lb.getLeaderboard({ limit: 10 });
    expect(total).toBe(3);
    expect(entries.map((e) => e.position)).toEqual([1, 2, 2]);
    expect(entries[0]).toMatchObject({ name: "Ada", image: "https://img/a.png", score: 9 });
    expect(entries[1].image).toContain("dicebear");
  });
});
