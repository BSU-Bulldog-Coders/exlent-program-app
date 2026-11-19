/** Accept only local class detail pages as an exercise return destination. */
export function exerciseReturnPath(value: string | string[] | undefined): string {
  return typeof value === "string" && /^\/(?:admin\/)?classes\/[a-zA-Z0-9_-]+$/.test(value)
    ? value
    : "/exercises";
}
