import { describe, expect, test } from "bun:test";
import { testcaseValidationError } from "../lib/exercise-validation";

describe("testcase validation", () => {
  test("requires at least one testcase", () => {
    expect(testcaseValidationError([])).toBe("Add at least one testcase.");
  });
  test("identifies blank input and output, including whitespace", () => {
    expect(testcaseValidationError([{ input: "  \n", expectedOutput: "1" }])).toBe("Enter input for testcase 1.");
    expect(testcaseValidationError([{ input: "1", expectedOutput: "\t" }])).toBe("Enter expected output for testcase 1.");
    expect(testcaseValidationError([{ input: "1", expectedOutput: "2" }, { input: "", expectedOutput: "2" }])).toBe("Enter input for testcase 2.");
  });
  test("accepts meaningful input and output without changing their whitespace", () => {
    const testcase = { input: "  1\n", expectedOutput: "  2\n" };
    expect(testcaseValidationError([testcase])).toBeNull();
    expect(testcase.input).toBe("  1\n");
    expect(testcase.expectedOutput).toBe("  2\n");
  });
});
