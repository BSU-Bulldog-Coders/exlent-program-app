import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
mock.module("next/navigation", () => ({ useRouter: () => ({ push() {}, refresh() {} }) }));
mock.module("@uiw/react-codemirror", () => ({ default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <textarea aria-label="Python starter code" value={value} onChange={e => onChange(e.target.value)} />, EditorView: { contentAttributes: { of: () => [] } } }));
const { ExerciseForm } = await import("../components/exercises/exercise-form");
afterEach(cleanup);
const classes = [{ id: "a", name: "Python Basics" }, { id: "b", name: "Web Development" }];
describe("exercise creation", () => {
  test("requires a title and retains selections while searching", () => {
    const view = render(<ExerciseForm classes={classes} />);
    fireEvent.click(view.getByRole("button", { name: "Next" }));
    view.getByText("Enter a title to continue.");
    fireEvent.change(view.getByLabelText("Title"), { target: { value: "Loops" } });
    fireEvent.click(view.getByRole("button", { name: "Next" }));
    view.getByLabelText("Python starter code");
    fireEvent.click(view.getByRole("button", { name: "Next" }));
    fireEvent.click(view.getByLabelText("Python Basics"));
    fireEvent.change(view.getByLabelText("Search classes"), { target: { value: "WEB" } });
    expect(view.queryByLabelText("Python Basics")).toBeNull();
    view.getByLabelText("Web Development");
    view.getByText("1 selected");
    fireEvent.change(view.getByLabelText("Search classes"), { target: { value: "" } });
    expect((view.getByLabelText("Python Basics") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(view.getByRole("button", { name: "Next" }));
    view.getByText("Testcase 1");
    fireEvent.click(view.getByRole("button", { name: "Add testcase" }));
    view.getByText("Testcase 2");
  });
});

describe("exercise editing", () => {
  test("keeps unsaved changes while moving between tabs", () => {
    const exercise = { id: "exercise-1", status: "DRAFT", title: "Original", description: "Description", starterCode: "print(1)", classes: [], currentRevision: { testcases: [{ input: "1", expectedOutput: "1" }] } };
    const view = render(<ExerciseForm classes={classes} exercise={exercise} />);
    fireEvent.change(view.getByLabelText("Title"), { target: { value: "Updated" } });
    fireEvent.click(view.getByRole("tab", { name: "Classes" }));
    fireEvent.click(view.getByLabelText("Python Basics"));
    fireEvent.click(view.getByRole("tab", { name: "Details" }));
    expect((view.getByLabelText("Title") as HTMLInputElement).value).toBe("Updated");
    fireEvent.click(view.getByRole("tab", { name: "Classes" }));
    expect((view.getByLabelText("Python Basics") as HTMLInputElement).checked).toBe(true);
  });
});

test("admin actions link to the submissions page", async () => {
  const exercise = { id: "exercise-1", status: "DRAFT", title: "Original", description: "Description", starterCode: "", classes: [], currentRevision: { testcases: [{ input: "1", expectedOutput: "1" }] } };
  const view = render(<ExerciseForm classes={classes} exercise={exercise} />);
  view.getByRole("button", { name: "Publish" });
  fireEvent.click(view.getByRole("button", { name: "More exercise actions" }));
  expect((await view.findByRole("menuitem", { name: "Submissions" })).getAttribute("href")).toBe("/exercises/exercise-1/submissions");
});

test("exercise list actions include a testcase reports link", async () => {
  const { ExerciseListActions } = await import("../components/exercises/exercise-list-actions");
  const view = render(<ExerciseListActions />);
  expect(view.getByRole("link", { name: /New exercise/ }).getAttribute("href")).toBe("/exercises/new");
  fireEvent.click(view.getByRole("button", { name: "More exercise actions" }));
  expect((await view.findByRole("menuitem", { name: /Testcase reports/ })).getAttribute("href")).toBe("/exercises/reports");
});

test("creation requires input and expected output before submitting", () => {
  const originalFetch = globalThis.fetch;
  const request = mock(async () => new Response("{}"));
  globalThis.fetch = request as unknown as typeof fetch;
  try {
    const view = render(<ExerciseForm classes={classes} />);
    fireEvent.change(view.getByLabelText("Title"), { target: { value: "Loops" } });
    for (let i = 0; i < 3; i++) fireEvent.click(view.getByRole("button", { name: "Next" }));
    fireEvent.click(view.getByRole("button", { name: "Create exercise" }));
    view.getByText("Enter input for testcase 1.");
    fireEvent.change(view.getByLabelText("Input"), { target: { value: "1\n" } });
    fireEvent.click(view.getByRole("button", { name: "Create exercise" }));
    view.getByText("Enter expected output for testcase 1.");
    expect(request).not.toHaveBeenCalled();
  } finally { globalThis.fetch = originalFetch; }
});

test("publishing an existing exercise with no testcases is blocked", () => {
  const originalFetch = globalThis.fetch;
  const request = mock(async () => new Response("{}"));
  globalThis.fetch = request as unknown as typeof fetch;
  try {
    const exercise = { id: "exercise-1", status: "DRAFT", title: "Original", description: "Description", starterCode: "", classes: [], currentRevision: { testcases: [] } };
    const view = render(<ExerciseForm classes={classes} exercise={exercise} />);
    fireEvent.click(view.getByRole("button", { name: "Publish" }));
    view.getByText("Add at least one testcase.");
    expect(request).not.toHaveBeenCalled();
  } finally { globalThis.fetch = originalFetch; }
});
