import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const state = { commands: [] as string[], deleted: 0, fail: false, output: "", stderr: "", exitCode: 0, options: null as unknown };
const box = {
  files: {
    write: mock(async () => {}),
    read: mock(async (path: string) => path.endsWith("error") ? state.stderr : state.output),
  },
  exec: { command: mock(async (command: string) => { state.commands.push(command); if (state.fail) throw new Error("offline"); return { exitCode: state.exitCode }; }) },
  delete: mock(async () => { state.deleted++; }),
};
mock.module("server-only", () => ({}));
mock.module("@upstash/box", () => ({ EphemeralBox: { create: mock(async (options: unknown) => { state.options = options; return box; }) } }));
let runner: typeof import("../lib/exercise-runner");
beforeAll(async () => { runner = await import("../lib/exercise-runner"); });
beforeEach(() => { state.commands = []; state.deleted = 0; state.fail = false; state.output = ""; state.stderr = ""; state.exitCode = 0; process.env.UPSTASH_BOX_API_KEY = "test"; });
const testcase = { id: "case", input: "1", expectedOutput: "hello\n" };
describe("Python exercise runner", () => {
  test("normalizes line endings and trailing whitespace but preserves content", () => {
    expect(runner.normalizeOutput("a  \r\nb\t\r\n")).toBe("a\nb");
    expect(runner.normalizeOutput(" a\nb")).not.toBe(runner.normalizeOutput("a\nb"));
  });
  test("uses a network-disabled ephemeral box, compares output and cleans up", async () => {
    state.output = "hello \r\n";
    const result = await runner.runPython("print('hello')", [testcase]);
    expect(result.results[0].status).toBe("PASSED");
    expect(state.options).toMatchObject({ runtime: "python", networkPolicy: { mode: "deny-all" }, ttl: 120 });
    expect(state.commands[0]).toContain("ulimit -v 262144");
    expect(state.deleted).toBe(1);
  });
  test("marks errors and incorrect output failed", async () => {
    state.output = "wrong";
    expect((await runner.runPython("pass", [testcase])).results[0].status).toBe("FAILED");
    state.exitCode = 124;
    expect((await runner.runPython("pass", [testcase])).results[0].error).toBe("Time limit exceeded");
  });
  test("preserves an unfinished result and cleans up after runner failure", async () => {
    state.fail = true;
    const result = await runner.runPython("pass", [testcase]);
    expect(result.failureReason).toBeTruthy();
    expect(result.results[0].status).toBe("UNFINISHED");
    expect(state.deleted).toBe(1);
  });
});
