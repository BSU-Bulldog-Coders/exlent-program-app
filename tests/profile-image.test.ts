import { describe, expect, test } from "bun:test";
import { MAX_AVATAR_SIZE, validateAvatarFile } from "../lib/profile-image";

const file = (type: string, size = 10, name = "pic") => new File([new Uint8Array(size)], name, { type });

describe("validateAvatarFile", () => {
  test("accepts an image under the limit", () => {
    const png = file("image/png");
    expect(validateAvatarFile(png)).toEqual({ file: png, extension: "png" });
    expect(validateAvatarFile(file("image/jpeg"))).toMatchObject({ extension: "jpg" });
  });

  test("accepts a file of exactly 10 MB and rejects anything larger", () => {
    expect(validateAvatarFile(file("image/png", MAX_AVATAR_SIZE))).toMatchObject({ extension: "png" });
    expect(validateAvatarFile(file("image/png", MAX_AVATAR_SIZE + 1))).toMatchObject({ status: 413 });
  });

  test("rejects non-image content types", () => {
    expect(validateAvatarFile(file("application/pdf"))).toMatchObject({ status: 415 });
    expect(validateAvatarFile(file(""))).toMatchObject({ status: 415 });
  });

  test("rejects image types we do not serve, such as SVG", () => {
    expect(validateAvatarFile(file("image/svg+xml"))).toMatchObject({ status: 415 });
  });

  test("rejects a missing, empty or non-file value", () => {
    expect(validateAvatarFile(null)).toMatchObject({ status: 400 });
    expect(validateAvatarFile("https://example.test/a.png")).toMatchObject({ status: 400 });
    expect(validateAvatarFile(file("image/png", 0))).toMatchObject({ status: 400 });
  });
});
