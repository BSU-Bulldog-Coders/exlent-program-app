"use client";
import { useRef, useState } from "react";
import { UserAvatar } from "@/components/app/user-avatar";
import { formatDateTime } from "@/lib/format";

type Entry = { id: string; name: string; image: string | null; points: number; submittedAt: string; passed: boolean };
type Run = { id: string; code: string; status: string; createdAt: string; results: { id: string; status: string; actualOutput: string | null; error: string | null; testcase: { position: number; input: string; expectedOutput: string } }[] };
export function ExerciseSubmissions({ exerciseId, entries }: { exerciseId: string; entries: Entry[] }) {
  const [selected, setSelected] = useState<Entry | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  async function open(entry: Entry) {
    const currentRequest = ++requestId.current;
    setSelected(entry); setRuns([]); setError(""); setLoading(true);
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/runs?userId=${encodeURIComponent(entry.id)}`);
      if (!response.ok) throw new Error("Could not load student submissions.");
      const data = await response.json();
      if (requestId.current === currentRequest) setRuns(data);
    } catch (e) { if (requestId.current === currentRequest) setError((e as Error).message); } finally { if (requestId.current === currentRequest) setLoading(false); }
  }
  if (!entries.length) return <div className="rounded-lg border p-4 text-sm text-muted-foreground">No submissions yet.</div>;
  return <div className="space-y-4"><div className="overflow-x-auto rounded-lg border"><div className="flex min-w-[32rem] justify-end gap-6 px-4 py-2 text-xs text-muted-foreground"><span>Submitted (UTC)</span><span>Points</span></div><ol className="min-w-[32rem] divide-y">{entries.map((entry, index) => <li key={entry.id}><button type="button" onClick={() => open(entry)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60" aria-label={`View submissions for ${entry.name}`}><span className="w-6 text-center text-sm font-medium tabular-nums text-muted-foreground">{index + 1}</span><UserAvatar user={entry} size="sm" /><span className="min-w-0 flex-1 truncate text-sm">{entry.name}<span className="ml-2 text-xs text-muted-foreground">{entry.passed ? "Passed" : "Not passed"}</span></span><time dateTime={entry.submittedAt} className="text-sm tabular-nums text-muted-foreground">{formatDateTime(entry.submittedAt, "UTC")}</time><span className="w-12 text-right text-sm font-medium tabular-nums">{entry.points}</span></button></li>)}</ol></div>{selected && <section className="space-y-2 rounded-lg border p-4"><h2 className="font-medium">{selected.name}&apos;s submissions</h2>{loading && <p className="text-sm text-muted-foreground">Loading submissions…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{!loading && !error && !runs.length && <p className="text-sm text-muted-foreground">No submissions found.</p>}{runs.map(run => <details key={run.id} className="rounded border p-3"><summary className="cursor-pointer text-sm">{run.status} · {formatDateTime(run.createdAt, "UTC")} UTC</summary><pre className="overflow-auto whitespace-pre-wrap text-xs">{run.code}</pre>{run.results.map(result => <div key={result.id} className="mt-2 text-xs"><strong>Testcase {result.testcase.position + 1}: {result.status}</strong><pre className="whitespace-pre-wrap">{`Input: ${result.testcase.input}\nExpected: ${result.testcase.expectedOutput}\nActual: ${result.actualOutput ?? "Not run"}${result.error ? `\nError: ${result.error}` : ""}`}</pre></div>)}</details>)}</section>}</div>;
}
