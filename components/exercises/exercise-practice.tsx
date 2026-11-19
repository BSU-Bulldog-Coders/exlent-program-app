"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { ArrowLeftIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
type Testcase = { id: string; position: number; input: string; expectedOutput: string };
type Run = { id: string; code: string; status: string; failureReason: string | null; createdAt: string; results: { id: string; status: string; actualOutput: string | null; error: string | null; testcase: Testcase }[] };
const extensions = [python(), EditorView.contentAttributes.of({ "aria-label": "Python code" })];
export function ExercisePractice({ exerciseId, userId, starterCode, latestCode, title, description, testcases, backHref, pageTitle = false }: { exerciseId: string; userId: string; starterCode: string; latestCode: string | null; title: string; description: string; testcases: Testcase[]; backHref?: string; pageTitle?: boolean }) {
  const isMobile = useIsMobile();
  const [code, setCode] = useState(latestCode ?? starterCode);
  const [runs, setRuns] = useState<Run[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      try { const saved = localStorage.getItem(`exercise-draft:v1:${userId}:${exerciseId}`); if (active && saved !== null) setCode(saved); } catch { if (active) setMessage("Could not access drafts in this browser."); }
      try { const response = await fetch(`/api/exercises/${exerciseId}/runs`); if (!response.ok) throw new Error("Could not load run history."); const history = await response.json(); if (active) setRuns(history); } catch (error) { if (active) setMessage((error as Error).message); } finally { if (active) setReady(true); }
    });
    return () => { active = false; };
  }, [exerciseId, userId]);
  function updateCode(value: string) { setCode(value); try { localStorage.setItem(`exercise-draft:v1:${userId}:${exerciseId}`, value); } catch { setMessage("Could not save your draft in this browser."); } }
  async function run() { setBusy(true); setMessage(""); try { const response = await fetch(`/api/exercises/${exerciseId}/runs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not run code."); setRuns(old => [result, ...old]); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }
  async function report(testcase: Testcase) { const reason = window.prompt("Why do you think this testcase is wrong?"); if (!reason?.trim()) return; try { const response = await fetch(`/api/exercises/${exerciseId}/testcases/${testcase.id}/reports`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not submit report."); setMessage("Testcase report submitted."); } catch (error) { setMessage((error as Error).message); } }
  return (
    <section aria-label="Exercise workspace" className={pageTitle ? "h-[calc(100dvh-3rem)] min-h-64 w-full" : "h-[calc(100dvh-7.75rem)] min-h-64 w-full md:h-[calc(100dvh-8.75rem)]"}>
      <ResizablePanelGroup orientation={isMobile ? "vertical" : "horizontal"} className="overflow-hidden">
        <ResizablePanel defaultSize="45%" minSize="25%" className="min-w-0 overflow-y-auto">
          <div className={pageTitle ? "space-y-5 p-4 md:p-6" : "space-y-5 pb-4 md:pr-6 md:pb-0"}>
            {backHref && <Link href={backHref} className="flex w-fit items-center gap-1 text-sm text-muted-foreground"><ArrowLeftIcon /> {backHref === "/exercises" ? "Exercises" : "Class"}</Link>}
            {pageTitle ? <h1 className="text-4xl">{title}</h1> : <h2 className="text-2xl">{title}</h2>}
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Description</h2>
              {description.trim() ? <p className="whitespace-pre-wrap text-sm">{description}</p> : <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">No description</div>}
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-medium">Testcases</h2>
              {testcases.length === 0 ? <p className="text-sm text-muted-foreground">No testcases yet.</p> : testcases.map(testcase => <div key={testcase.id} className="space-y-2 rounded-md border p-3 text-sm"><h3 className="font-medium">Testcase {testcase.position + 1}</h3><div><span className="text-muted-foreground">Input</span><pre className="overflow-auto whitespace-pre-wrap font-mono text-xs">{testcase.input || "(empty)"}</pre></div><div><span className="text-muted-foreground">Expected output</span><pre className="overflow-auto whitespace-pre-wrap font-mono text-xs">{testcase.expectedOutput || "(empty)"}</pre></div></div>)}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize exercise panels" />
        <ResizablePanel defaultSize="55%" minSize="25%" className="min-w-0 overflow-y-auto">
          <div className={pageTitle ? "space-y-4 p-4 md:p-6" : "space-y-4 pt-4 md:pt-0 md:pl-6"}>
            <div className="flex items-center justify-between gap-3"><h2 className="text-2xl">Practice</h2><Button size="sm" disabled={!ready || busy} onClick={run}><PlayIcon />{busy ? "Running…" : "Run code"}</Button></div>
            <CodeMirror className="overflow-hidden rounded-md border text-sm" minHeight="16rem" value={code} extensions={extensions} onChange={updateCode} editable={ready} />
            {message && <p role="status" className="text-sm">{message}</p>}
            <div className="space-y-3"><h3 className="text-lg font-medium">Run history</h3>{runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}{runs.map(run => <details key={run.id} open={runs[0]?.id === run.id} className="rounded-md border p-3"><summary className="cursor-pointer font-medium"><Badge variant="secondary" className={`mx-1 rounded-sm px-2 ${run.status === "PASSED" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : run.status === "FAILED" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" : ""}`}>{run.status}</Badge> <span className="text-sm">{new Date(run.createdAt).toLocaleString()}</span></summary>{run.failureReason && <p className="mt-2 text-sm">{run.failureReason}</p>}<details className="mt-2 rounded-md bg-muted p-3"><summary className="cursor-pointer text-sm">Submitted code</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{run.code}</pre></details><div className="mt-3 space-y-2">{run.results.map(result => <div key={result.id} className="rounded border p-3 text-sm"><div className="flex justify-between gap-2"><strong>Testcase {result.testcase.position + 1}: {result.status}</strong><Button variant="ghost" size="sm" onClick={() => report(result.testcase)}>Report testcase</Button></div>{[["Input", result.testcase.input], ["Expected", result.testcase.expectedOutput], ["Actual", result.actualOutput ?? "Not run"], ...(result.error ? [["Error", result.error]] : [])].map(([label, value]) => <div key={label}><span className="text-muted-foreground">{label}</span><pre className="overflow-auto whitespace-pre-wrap font-mono text-xs">{value || "(empty)"}</pre></div>)}</div>)}</div></details>)}</div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
}
