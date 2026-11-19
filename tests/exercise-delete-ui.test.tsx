import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

const refresh = mock(() => {});
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const { ExerciseRowActions } = await import("../components/exercises/exercise-row-actions");
const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; refresh.mockClear(); });

describe("exercise deletion", () => {
  test("requires confirmation before sending the delete request", async () => {
    const request = mock(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    globalThis.fetch = request as unknown as typeof fetch;
    const view = render(<ExerciseRowActions id="exercise-1" title="Loops" />);
    fireEvent.click(view.getByRole("button", { name: "Actions for Loops" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete exercise" }));
    await view.findByRole("dialog", { name: "Delete exercise?" });
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole("button", { name: "Delete exercise" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("/api/exercises/exercise-1", { method: "DELETE" }));
  });
});
