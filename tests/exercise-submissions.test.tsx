import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { ExerciseSubmissions } from "../components/exercises/exercise-submissions";

afterEach(cleanup);
test("shows latest submission time before leaderboard points and opens student history", async () => {
  const originalFetch = globalThis.fetch;
  const request = mock(async () => new Response(JSON.stringify([{ id: "run-1", code: "print(1)", status: "PASSED", createdAt: "2026-11-19T12:00:00Z", results: [] }]), { status: 200 }));
  globalThis.fetch = request as unknown as typeof fetch;
  try {
    const view = render(<ExerciseSubmissions exerciseId="exercise-1" entries={[{ id: "student-1", name: "Ada", image: null, submittedAt: "2026-11-19T12:00:00Z", points: 42, passed: true }]} />);
    const row = view.getByRole("button", { name: "View submissions for Ada" });
    expect(row.textContent?.indexOf("Nov 19, 2026")).toBeLessThan(row.textContent?.lastIndexOf("42") ?? -1);
    within(row).getByText("Passed");
    fireEvent.click(row);
    await view.findByText("print(1)");
    expect(request).toHaveBeenCalledWith("/api/exercises/exercise-1/runs?userId=student-1");
  } finally { globalThis.fetch = originalFetch; }
});
