import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { ExercisePractice } from "../components/exercises/exercise-practice";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
test("shows problem details and empty description beside the editor", async () => {
  globalThis.fetch = mock(async () => new Response("[]", { status: 200 })) as unknown as typeof fetch;
  const view = render(<ExercisePractice exerciseId="exercise-1" userId="student-1" title="Add numbers" description="" starterCode="" latestCode={null} pageTitle testcases={[{ id: "case-1", position: 0, input: "2\n3", expectedOutput: "5" }]} />);
  view.getByRole("heading", { name: "Add numbers", level: 1 });
  view.getByText("No description");
  view.getByText("Testcase 1");
  view.getByText("2 3");
  view.getByText("5");
  view.getByRole("heading", { name: "Practice" });
  expect(view.getByRole("separator", { name: "Resize exercise panels" }).getAttribute("aria-orientation")).toBe("vertical");
  await waitFor(() => expect(view.getByRole("button", { name: "Run code" }).hasAttribute("disabled")).toBe(false));
});

test("stacks the resizable panels with a horizontal separator on mobile", async () => {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = (() => ({ matches: true, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  globalThis.fetch = mock(async () => new Response("[]", { status: 200 })) as unknown as typeof fetch;
  try {
    const view = render(<ExercisePractice exerciseId="exercise-2" userId="student-1" title="Mobile" description="Problem text" starterCode="" latestCode={null} pageTitle testcases={[]} />);
    expect(view.getByRole("separator", { name: "Resize exercise panels" }).getAttribute("aria-orientation")).toBe("horizontal");
    view.getByText("Problem text");
    await waitFor(() => expect(view.getByRole("button", { name: "Run code" }).hasAttribute("disabled")).toBe(false));
  } finally { cleanup(); window.matchMedia = originalMatchMedia; }
});
