// Pure helpers for the classes list (page, pageSize, q). No server-only imports,
// so the API route, both pages and the client search box share one definition.

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
export const MAX_QUERY_LENGTH = 100;

export type ClassListParams = { page: number; pageSize: number; q: string };

type RawValue = string | string[] | null | undefined;

function first(value: RawValue) {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

function positiveInt(value: RawValue, fallback: number) {
  const n = Number.parseInt(first(value) ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Forgiving parse: bad or missing values fall back to defaults instead of erroring. */
export function parseClassListParams(raw: {
  page?: RawValue;
  pageSize?: RawValue;
  q?: RawValue;
}): ClassListParams {
  return {
    page: positiveInt(raw.page, 1),
    pageSize: Math.min(positiveInt(raw.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
    q: (first(raw.q) ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH),
  };
}

/** URL for a list state. Defaults are left out so URLs stay short and shareable. */
export function classListHref(basePath: string, { page, pageSize, q }: ClassListParams) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (page > 1) search.set("page", String(page));
  if (pageSize !== DEFAULT_PAGE_SIZE) search.set("pageSize", String(pageSize));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
