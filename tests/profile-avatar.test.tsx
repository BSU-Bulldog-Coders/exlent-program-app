import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

const toastError = mock(() => {});
mock.module("sonner", () => ({ toast: { error: toastError } }));

const { ProfileAvatar } = await import("../components/app/profile-avatar");

const user = { id: "user-1", name: "Ada Lovelace", image: "https://example.test/old.png" };
const picked = () => new File([new Uint8Array(10)], "new.png", { type: "image/png" });
const shownSrc = (container: HTMLElement) => container.querySelector("[data-src]")!.getAttribute("data-src");

function selectFile(container: HTMLElement, file: File) {
  const input = container.querySelector("input")!;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  toastError.mockClear();
  URL.createObjectURL = () => "blob:preview";
  URL.revokeObjectURL = () => {};
});
afterEach(cleanup);

describe("ProfileAvatar", () => {
  test("input is a hidden file input named image that only takes images", () => {
    const { container } = render(<ProfileAvatar user={user} />);
    const input = container.querySelector("input")!;
    expect(input.name).toBe("image");
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*");
    expect(input.className).toContain("sr-only");
  });

  test("clicking the avatar or its edit icon opens the file picker", () => {
    const click = spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const { getByRole, container } = render(<ProfileAvatar user={user} />);
    fireEvent.click(getByRole("button", { name: "Change avatar" }));
    expect(click).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('[data-slot="avatar-edit"]')!);
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  test("shows the picked image immediately, before the upload finishes", async () => {
    let finish!: (url: string) => void;
    const upload = mock(() => new Promise<string>((resolve) => (finish = resolve)));
    const { container } = render(<ProfileAvatar user={user} upload={upload} />);
    expect(shownSrc(container)).toBe(user.image);

    selectFile(container, picked());
    await waitFor(() => expect(shownSrc(container)).toBe("blob:preview"));

    await act(async () => finish("https://example.test/new.png"));
    await waitFor(() => expect(shownSrc(container)).toBe("https://example.test/new.png"));
    expect(toastError).not.toHaveBeenCalled();
  });

  test("reverts to the previous image and reports the error when the upload fails", async () => {
    let fail!: (error: Error) => void;
    const upload = mock(() => new Promise<string>((_, reject) => (fail = reject)));
    const { container } = render(<ProfileAvatar user={user} upload={upload} />);

    selectFile(container, picked());
    await waitFor(() => expect(shownSrc(container)).toBe("blob:preview"));

    await act(async () => fail(new Error("Could not upload the image. Try again.")));
    await waitFor(() => expect(shownSrc(container)).toBe(user.image));
    expect(toastError).toHaveBeenCalledWith("Could not upload the image. Try again.");
  });

  test("rejects non-image files without uploading", () => {
    const upload = mock(async () => "x");
    const { container } = render(<ProfileAvatar user={user} upload={upload} />);
    selectFile(container, new File(["x"], "doc.pdf", { type: "application/pdf" }));
    expect(upload).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
    expect(shownSrc(container)).toBe(user.image);
  });
});
