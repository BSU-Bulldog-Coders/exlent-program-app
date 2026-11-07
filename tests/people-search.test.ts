import { describe, expect, test } from "bun:test";
import {
  countMatchingNames,
  filterByName,
  isSearching,
  matchesName,
  normalizeSearch,
} from "../lib/people-search";

describe("people search matching", () => {
  test("is case insensitive", () => {
    expect(matchesName("Ada Lovelace", "ada")).toBeTrue();
    expect(matchesName("Ada Lovelace", "LOVELACE")).toBeTrue();
    expect(matchesName("ada lovelace", "ADA LOVE")).toBeTrue();
    expect(matchesName("Émile Zola", "éMILE")).toBeTrue();
  });

  test("matches anywhere in the name, not just the start", () => {
    expect(matchesName("Ada Lovelace", "lace")).toBeTrue();
    expect(matchesName("Ada Lovelace", "a l")).toBeTrue();
  });

  test("ignores surrounding and repeated whitespace", () => {
    expect(matchesName("Ada Lovelace", "  ada  ")).toBeTrue();
    expect(matchesName("Ada  Lovelace", "ada lovelace")).toBeTrue();
    expect(normalizeSearch("  Ada   LOVELACE ")).toBe("ada lovelace");
  });

  test("an empty or blank query matches everyone", () => {
    expect(isSearching("")).toBeFalse();
    expect(isSearching("   ")).toBeFalse();
    expect(matchesName("Ada Lovelace", "")).toBeTrue();
    expect(matchesName("Ada Lovelace", "   ")).toBeTrue();
  });

  test("looks at the name only: an email-only match does not count", () => {
    const people = [{ name: "Ada Lovelace", email: "grace@example.test" }];
    expect(filterByName(people, "grace")).toEqual([]);
    expect(filterByName(people, "example")).toEqual([]);
  });

  test("filterByName keeps order and returns a copy when not searching", () => {
    const people = [{ name: "Ada" }, { name: "Grace" }, { name: "Adam" }];
    expect(filterByName(people, "ad").map((person) => person.name)).toEqual(["Ada", "Adam"]);
    const all = filterByName(people, "");
    expect(all).toEqual(people);
    expect(all).not.toBe(people);
  });

  test("countMatchingNames mirrors the filter", () => {
    expect(countMatchingNames(["Ada", "Grace", "Adam"], "AD")).toBe(2);
    expect(countMatchingNames(["Ada", "Grace"], "")).toBe(2);
    expect(countMatchingNames([], "x")).toBe(0);
  });
});
