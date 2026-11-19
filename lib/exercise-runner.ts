import "server-only";
import { EphemeralBox } from "@upstash/box";

export const MAX_BYTES = 64 * 1024;
export function normalizeOutput(value: string) {
  return value.replace(/\r\n?/g, "\n").split("\n").map(line => line.replace(/[\t ]+$/g, "")).join("\n").replace(/\n+$/, "");
}
type Case = { id: string; input: string; expectedOutput: string };
type Result = { testcaseId: string; status: "PASSED" | "FAILED" | "UNFINISHED"; actualOutput: string | null; error: string | null };
export async function runPython(code: string, cases: Case[], time: <T>(label: string, operation: () => Promise<T>) => Promise<T> = async (_label, operation) => operation()): Promise<{ results: Result[]; failureReason: string | null }> {
  const results: Result[] = [];
  const deadline = Date.now() + 30_000;
  let failureReason: string | null = null;
  let box: Awaited<ReturnType<typeof EphemeralBox.create>> | undefined;
  async function beforeDeadline<T>(operation: Promise<T>): Promise<T> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Run time limit exceeded");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Run time limit exceeded")), remaining); })]); }
    finally { if (timer) clearTimeout(timer); }
  }
  try {
    if (!process.env.UPSTASH_BOX_API_KEY) throw new Error("Python runner is not configured");
    const creating = EphemeralBox.create({ apiKey: process.env.UPSTASH_BOX_API_KEY, runtime: "python", ttl: 120, networkPolicy: { mode: "deny-all" }, timeout: 30000 });
    // If creation completes after the deadline, clean up the late box as well.
    creating.then(late => { if (Date.now() >= deadline) void late.delete().catch(() => {}); }).catch(() => {});
    box = await time("sandbox.create", () => beforeDeadline(creating));
    await time("sandbox.write_code", () => beforeDeadline(box!.files.write({ path: "/tmp/exercise.py", content: code })));
    for (const [index, testcase] of cases.entries()) {
      const remaining = deadline - Date.now();
      if (remaining < 1000) { failureReason = "Run time limit exceeded"; break; }
      await time(`case.${index + 1}.write_input`, () => beforeDeadline(box!.files.write({ path: "/tmp/exercise-input", content: testcase.input })));
      const seconds = Math.max(1, Math.min(10, Math.floor((deadline - Date.now()) / 1000)));
      // Fixed paths and command: student-controlled strings never enter the shell.
      const run = await time(`case.${index + 1}.execute`, () => beforeDeadline(box!.exec.command(`ulimit -v 262144; ulimit -f 128; timeout -k 1 ${seconds} python3 /tmp/exercise.py < /tmp/exercise-input > /tmp/exercise-output 2> /tmp/exercise-error`)));
      const [output, stderr] = await time(`case.${index + 1}.read_output`, () => beforeDeadline(Promise.all([
        box!.files.read("/tmp/exercise-output", { length: MAX_BYTES + 1 }),
        box!.files.read("/tmp/exercise-error", { length: MAX_BYTES + 1 }),
      ])));
      const tooLarge = Buffer.byteLength(output) > MAX_BYTES || Buffer.byteLength(stderr) > MAX_BYTES;
      const error = tooLarge ? "Output limit exceeded" : run.exitCode === 124 || run.exitCode === 137 ? "Time limit exceeded" : run.exitCode !== 0 ? (stderr.slice(0, MAX_BYTES) || `Process exited with code ${run.exitCode}`) : null;
      results.push({ testcaseId: testcase.id, status: !error && normalizeOutput(output) === normalizeOutput(testcase.expectedOutput) ? "PASSED" : "FAILED", actualOutput: output.slice(0, MAX_BYTES), error });
    }
  } catch (error) {
    failureReason = error instanceof Error && error.message === "Run time limit exceeded" ? error.message : "The Python runner could not complete this run";
  } finally {
    if (box) await time("sandbox.cleanup", () => Promise.race([box!.delete().catch(() => {}), new Promise<void>(resolve => setTimeout(resolve, 1000))]));
  }
  for (const testcase of cases.slice(results.length)) results.push({ testcaseId: testcase.id, status: "UNFINISHED", actualOutput: null, error: failureReason });
  return { results, failureReason };
}
