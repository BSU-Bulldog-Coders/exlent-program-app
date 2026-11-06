/** Exponential retry delay, capped so an active reset link is never held indefinitely. */
export function emailRetryDelayMs(attempts: number) {
  return Math.min(60 * 60 * 1000, 60_000 * 2 ** Math.max(0, attempts - 1));
}
