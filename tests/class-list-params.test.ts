import { describe, expect, test } from "bun:test";
import { classListHref, parseClassListParams } from "../lib/class-list-params";

describe("parseClassListParams", () => {
  test("defaults", () => {
    expect(parseClassListParams({})).toEqual({ page: 1, pageSize: 10, q: "" });
  });
  test("falls back on junk and clamps pageSize", () => {
    expect(parseClassListParams({ page: "-3", pageSize: "abc" })).toMatchObject({ page: 1, pageSize: 10 });
    expect(parseClassListParams({ pageSize: "9999" }).pageSize).toBe(50);
    expect(parseClassListParams({ page: "0" }).page).toBe(1);
  });
  test("trims and collapses q, takes first of repeated params", () => {
    expect(parseClassListParams({ q: ["  intro   to  js ", "x"] }).q).toBe("intro to js");
  });
});

describe("classListHref", () => {
  test("omits defaults", () => {
    expect(classListHref("/classes", { page: 1, pageSize: 10, q: "" })).toBe("/classes");
    expect(classListHref("/classes", { page: 3, pageSize: 10, q: "js" })).toBe("/classes?q=js&page=3");
    expect(classListHref("/classes", { page: 1, pageSize: 25, q: "" })).toBe("/classes?pageSize=25");
  });
});
