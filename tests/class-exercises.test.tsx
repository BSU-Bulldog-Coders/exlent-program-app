import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ClassContentTabs } from "../components/classes/class-content-tabs";
import { ExerciseTable } from "../components/exercises/exercise-table";

afterEach(cleanup);
const exercises = [{ id: "ex1", title: "Add numbers", status: "PUBLISHED" as const, currentRevisionId: "revision-1", classes: [{ class: { name: "Python 101" } }], progress: [{ passedRevisionId: "revision-1" }] }];
describe("class resources and exercises", () => {
  test("shows resources first and switches to the passed exercise table", () => {
    const view = render(<ClassContentTabs resources={<p>Class materials</p>} exercises={<ExerciseTable exercises={exercises} isAdmin={false} />} />);
    view.getByText("Class materials");
    fireEvent.click(view.getByRole("tab", { name: "Exercises" }));
    expect(view.getByRole("link", { name: "Add numbers" }).getAttribute("href")).toBe("/exercises/ex1");
    view.getByText("Python 101");
    view.getByText("Passed");
  });
  test("offers a creation link to admins in the empty state only", () => {
    const view = render(<ExerciseTable exercises={[]} isAdmin />);
    view.getByText("No exercises yet");
    expect(view.getByRole("link", { name: "New exercise" }).getAttribute("href")).toBe("/exercises/new");
    view.rerender(<ExerciseTable exercises={[]} isAdmin={false} />);
    expect(view.queryByRole("link", { name: "New exercise" })).toBeNull();
  });
});

test("exercise links retain their originating class", () => {
  const view = render(<ExerciseTable exercises={exercises} isAdmin={false} returnTo="/classes/class-1" />);
  const link = view.getByRole("link", { name: "Add numbers" });
  expect(link.getAttribute("href")).toBe("/exercises/ex1?returnTo=%2Fclasses%2Fclass-1");
});
