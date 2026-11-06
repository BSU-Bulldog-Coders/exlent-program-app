/** Toast text for a closed class, noting any missed-classes follow-up. */
export function closeSummary(
  result: { warned: number; scheduledForDeletion: number; alreadyClosed?: boolean },
  base = "Class closed.",
) {
  if (result.alreadyClosed) return "This class was already closed.";
  const notes = [
    result.warned > 0 ? `${result.warned} ${result.warned === 1 ? "student" : "students"} warned for missing two classes` : null,
    result.scheduledForDeletion > 0
      ? `${result.scheduledForDeletion} ${result.scheduledForDeletion === 1 ? "account" : "accounts"} scheduled for deletion`
      : null,
  ].filter(Boolean);
  return notes.length > 0 ? `${base} ${notes.join(", ")}.` : base;
}
