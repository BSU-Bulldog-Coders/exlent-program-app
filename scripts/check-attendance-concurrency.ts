// Verifies the missed-classes check under real concurrency. Mocks cannot prove
// locking, so this replays the migrations into a throwaway Postgres schema,
// races the real evaluator against itself, and drops the schema afterwards.
//
//   TEST_DATABASE_URL="<direct, non-pooled postgres url>" bun run check:attendance-concurrency
//
// It only ever creates, uses and drops one schema named awtest_<random>; no
// existing table is read or written. Use a direct connection (not the Neon
// pooler) because the search_path is set with a startup option.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const baseUrl = process.env.TEST_DATABASE_URL ?? "";
if (!baseUrl) {
  console.error("Set TEST_DATABASE_URL to a direct Postgres URL (a throwaway database or branch is best).");
  process.exit(1);
}

const schema = `awtest_${randomBytes(4).toString("hex")}`;
const withSchema = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}options=${encodeURIComponent(`-c search_path=${schema}`)}`;

// Point the app's own client at the throwaway schema before anything imports it.
process.env.DATABASE_URL = withSchema(baseUrl);
// Prisma qualifies every table with a schema name, so search_path alone is not
// enough: this makes the app's client read and write the throwaway schema.
process.env.DATABASE_SCHEMA = schema;
process.env.BETTER_AUTH_SECRET ??= "concurrency-check-secret";

const DAY = 24 * 60 * 60 * 1000;
const t0 = Date.UTC(2026, 0, 1);
const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

async function main() {
  const admin = new pg.Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${schema}"`);

  try {
    const scoped = new pg.Client({ connectionString: withSchema(baseUrl) });
    await scoped.connect();
    const dir = join(process.cwd(), "prisma", "migrations");
    for (const name of readdirSync(dir).filter((entry) => !entry.endsWith(".toml")).sort()) {
      await scoped.query(readFileSync(join(dir, name, "migration.sql"), "utf8"));
    }
    await scoped.end();

    const { prisma } = await import("../lib/prisma");

    // Safety check before any write: a marker row exists only in the throwaway
    // schema, so the client must be able to see it. Otherwise it is pointed
    // somewhere else (e.g. the real "public" tables) and we stop.
    await admin.query(
      `INSERT INTO "${schema}"."user" (id, name, email, "updatedAt") VALUES ('schema-probe', 'probe', 'probe@x.test', now())`,
    );
    const probe = await prisma.user.findUnique({ where: { id: "schema-probe" } });
    if (!probe) throw new Error("Refusing to run: the database client is not using the throwaway schema.");
    await admin.query(`DELETE FROM "${schema}"."user" WHERE id = 'schema-probe'`);
    const { evaluateClassClosure } = await import("../lib/attendance-warnings");

    const actor = { id: "admin" };
    let n = 0;
    const id = (prefix: string) => `${prefix}-${++n}`;

    async function resetData() {
      await prisma.$executeRawUnsafe(
        `TRUNCATE "AttendanceWarning","Attendance","Class","user" RESTART IDENTITY CASCADE`,
      );
      await prisma.user.create({
        data: { id: "admin", name: "Admin", email: "admin@x.test", emailVerified: true, role: "ADMIN" },
      });
      await prisma.user.create({
        data: { id: "regular", name: "Regular", email: "regular@x.test", emailVerified: true },
      });
    }

    async function student(name: string) {
      return prisma.user.create({
        data: {
          id: id("s"),
          name,
          email: `${name.toLowerCase()}@x.test`,
          emailVerified: true,
          createdAt: new Date(t0 - 30 * DAY),
        },
      });
    }

    // A closed, unchecked class that "regular" attended, so it counts as held.
    async function heldClass(day: number, attendees: string[] = []) {
      const item = await prisma.class.create({
        data: {
          id: id("c"),
          name: `Class ${day}`,
          startsAt: new Date(t0 + day * DAY),
          openedAt: new Date(t0 + day * DAY),
          closedAt: new Date(t0 + day * DAY + 1000),
          timezone: "UTC",
          status: "CLOSED",
          createdById: "admin",
        },
      });
      await prisma.attendance.createMany({
        data: ["regular", ...attendees].map((userId) => ({ classId: item.id, userId })),
      });
      return item;
    }

    async function scenario(name: string, run: () => Promise<void>) {
      try {
        await resetData();
        await run();
        results.push({ name, ok: true });
      } catch (error) {
        results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
      }
    }

    await scenario("same class evaluated twice at once: exactly one warning", async () => {
      const s1 = await student("S1");
      await heldClass(1);
      await heldClass(2);
      const c3 = await heldClass(3);
      const [a, b] = await Promise.all([evaluateClassClosure(c3.id, actor), evaluateClassClosure(c3.id, actor)]);
      assert.equal(await prisma.attendanceWarning.count({ where: { userId: s1.id } }), 1);
      assert.equal(a.warned + b.warned, 1);
      assert.deepEqual([a.skipped, b.skipped].filter(Boolean), ["already-checked"]);
    });

    // The interesting race: the lock is what stops both evaluators from warning
    // for their own class. A race can pass by luck once, so repeat it.
    await scenario("two consecutive classes closed at once (x15): one warning, no deletion", async () => {
      for (let run = 0; run < 15; run++) {
        await resetData();
        const s1 = await student("S1");
        await heldClass(1);
        const c2 = await heldClass(2);
        const c3 = await heldClass(3);
        await Promise.all([evaluateClassClosure(c2.id, actor), evaluateClassClosure(c3.id, actor)]);
        assert.equal(await prisma.attendanceWarning.count({ where: { userId: s1.id } }), 1, `run ${run + 1}`);
        const user = await prisma.user.findUniqueOrThrow({ where: { id: s1.id } });
        assert.equal(user.deletionScheduledAt, null, `run ${run + 1}`);
      }
    });

    await scenario("third miss with a delivered warning, checked twice at once: scheduled exactly once", async () => {
      const s1 = await student("S1");
      await heldClass(1);
      const c2 = await heldClass(2);
      const c3 = await heldClass(3);
      await prisma.attendanceWarning.create({
        data: {
          userId: s1.id,
          classId: c2.id,
          previousClassId: (await prisma.class.findFirstOrThrow({ where: { name: "Class 1" } })).id,
          recipientEmail: "s1@x.test",
          idempotencyKey: "seed-warning",
          status: "SENT",
          sentAt: new Date(),
        },
      });
      const [a, b] = await Promise.all([evaluateClassClosure(c3.id, actor), evaluateClassClosure(c3.id, actor)]);
      assert.equal(a.scheduledForDeletion + b.scheduledForDeletion, 1);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: s1.id } });
      assert.notEqual(user.deletionScheduledAt, null);
    });

    await scenario("attending after a warning clears it: warned again, not deleted", async () => {
      const s1 = await student("S1");
      await heldClass(1);
      const c2 = await heldClass(2);
      await heldClass(3, [s1.id]);
      await heldClass(4);
      const c5 = await heldClass(5);
      await prisma.attendanceWarning.create({
        data: {
          userId: s1.id,
          classId: c2.id,
          previousClassId: (await prisma.class.findFirstOrThrow({ where: { name: "Class 1" } })).id,
          recipientEmail: "s1@x.test",
          idempotencyKey: "seed-warning",
          status: "SENT",
          sentAt: new Date(),
        },
      });
      const result = await evaluateClassClosure(c5.id, actor);
      assert.equal(result.warned, 1);
      assert.equal(result.scheduledForDeletion, 0);
    });

    await scenario("a warning still being delivered blocks both a duplicate warning and escalation", async () => {
      const s1 = await student("S1");
      const c1 = await heldClass(1);
      const c2 = await heldClass(2);
      const c3 = await heldClass(3);
      await prisma.attendanceWarning.create({
        data: {
          userId: s1.id,
          classId: c2.id,
          previousClassId: c1.id,
          recipientEmail: "s1@x.test",
          idempotencyKey: "seed-warning",
          status: "PENDING",
        },
      });
      const result = await evaluateClassClosure(c3.id, actor);
      assert.deepEqual([result.warned, result.scheduledForDeletion], [0, 0]);
    });

    await prisma.$disconnect();
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
}

main()
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name}${result.detail ? `\n      ${result.detail}` : ""}`);
    }
    if (results.some((result) => !result.ok)) process.exitCode = 1;
    process.exit();
  });
