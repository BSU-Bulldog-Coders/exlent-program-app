// Pure helpers for the People page search. No server-only imports: this runs in
// the browser, over the full list the page already loaded.

/** Trim, collapse inner whitespace and lower-case, so matching ignores case and stray spaces. */
export function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSearching(query: string) {
  return normalizeSearch(query) !== "";
}

/** True when `name` contains the query. Matches on the name only, never the email. An empty query matches everyone. */
export function matchesName(name: string, query: string) {
  const needle = normalizeSearch(query);
  return needle === "" || normalizeSearch(name).includes(needle);
}

export function filterByName<T extends { name: string }>(items: readonly T[], query: string): T[] {
  return isSearching(query) ? items.filter((item) => matchesName(item.name, query)) : [...items];
}

export function countMatchingNames(names: readonly string[], query: string) {
  return isSearching(query) ? names.filter((name) => matchesName(name, query)).length : names.length;
}
