export type TestcaseValues = { input: string; expectedOutput: string };

/** Validate without altering whitespace in valid testcase input or output. */
export function testcaseValidationError(testcases: readonly TestcaseValues[]): string | null {
  if (testcases.length === 0) return "Add at least one testcase.";
  for (const [index, testcase] of testcases.entries()) {
    if (!testcase.input.trim()) return `Enter input for testcase ${index + 1}.`;
    if (!testcase.expectedOutput.trim()) return `Enter expected output for testcase ${index + 1}.`;
  }
  return null;
}
