/** Deterministic (locale + zone pinned) so server and client render the same text. */
export function formatDateTime(value: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatTime(value: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short", timeZone }).format(
    new Date(value),
  );
}

export function formatDate(value: Date | string, timeZone = "UTC") {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone }).format(
    new Date(value),
  );
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function percent(numerator: number, denominator: number) {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}
