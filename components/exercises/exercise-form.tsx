"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { ArchiveIcon, CaretDownIcon, UploadSimpleIcon, UsersIcon } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { testcaseValidationError } from "@/lib/exercise-validation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ExerciseFormData = { title: string; description: string; starterCode: string; classIds: string[]; testcases: { input: string; expectedOutput: string }[] };
type Props = { classes: { id: string; name: string }[]; exercise?: { id: string; status: string; currentRevisionId?: string | null; title: string; description: string; starterCode: string; classes: { class: { id: string } }[]; currentRevision: { testcases: { input: string; expectedOutput: string }[] } | null } };
const steps = ["Details", "Starter code", "Classes", "Testcases"] as const;
const extensions = [python(), EditorView.contentAttributes.of({ "aria-label": "Python starter code" })];
function getInitial(exercise?: Props["exercise"]): ExerciseFormData { return exercise ? { title: exercise.title, description: exercise.description, starterCode: exercise.starterCode, classIds: exercise.classes.map(c => c.class.id), testcases: exercise.currentRevision?.testcases.map(({ input, expectedOutput }) => ({ input, expectedOutput })) ?? [{ input: "", expectedOutput: "" }] } : { title: "", description: "", starterCode: "", classIds: [], testcases: [{ input: "", expectedOutput: "" }] }; }
export function ExerciseForm({ classes, exercise }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => getInitial(exercise));
  const [saved, setSaved] = useState(() => JSON.stringify(getInitial(exercise)));
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(exercise?.status);
  const dirty = JSON.stringify(form) !== saved;
  const visibleClasses = classes.filter(c => c.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  function validate() { if (!form.title.trim()) { setStep(0); setMessage("Enter a title before saving."); return false; } const error = testcaseValidationError(form.testcases); if (error) { setStep(3); setMessage(error); return false; } return true; }
  async function save() {
    if (!validate()) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(exercise ? `/api/exercises/${exercise.id}` : "/api/exercises", { method: exercise ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save exercise.");
      if (!exercise) { router.push(`/exercises/${data.id}`); router.refresh(); return; }
      setSaved(JSON.stringify(form)); setMessage("Changes saved."); router.refresh();
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  async function changeStatus() {
    if (!exercise || dirty) return;
    if (status !== "PUBLISHED") { const error = testcaseValidationError(form.testcases); if (error) { setStep(3); setMessage(error); return; } }
    setBusy(true); setMessage("");
    try { const response = await fetch(`/api/exercises/${exercise.id}/${status === "PUBLISHED" ? "archive" : "publish"}`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not update status."); setStatus(data.status); setMessage(data.status === "PUBLISHED" ? "Exercise published." : "Exercise archived."); router.refresh(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  const sections = [<div className="space-y-4" key="details"><label className="block space-y-2 text-sm font-medium">Title<Input value={form.title} maxLength={200} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Adding two numbers" /></label><label className="block space-y-2 text-sm font-medium">Description<Textarea rows={7} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem, input, and expected output." /></label></div>, <div className="space-y-3" key="starter"><p className="text-muted-foreground">Optional code students see when they begin the exercise.</p><CodeMirror className="overflow-hidden rounded-md border" minHeight="16rem" value={form.starterCode} extensions={extensions} onChange={starterCode => setForm({ ...form, starterCode })} /></div>, <fieldset className="space-y-3" key="classes"><legend className="font-medium">Assigned classes</legend><p className="text-muted-foreground">Optional. All students can access published exercises.</p><Input aria-label="Search classes" placeholder="Search classes" value={search} onChange={e => setSearch(e.target.value)} /><div className="max-h-64 space-y-1 overflow-auto rounded-md border p-3">{visibleClasses.length ? visibleClasses.map(c => <label className="flex items-center gap-2 rounded p-2 hover:bg-muted" key={c.id}><input type="checkbox" checked={form.classIds.includes(c.id)} onChange={e => setForm({ ...form, classIds: e.target.checked ? [...form.classIds, c.id] : form.classIds.filter(id => id !== c.id) })} />{c.name}</label>) : <p className="p-2 text-muted-foreground">{classes.length ? "No classes match your search." : "No classes yet."}</p>}</div><p className="text-muted-foreground">{form.classIds.length} selected</p></fieldset>, <div className="space-y-4" key="testcases"><p className="text-muted-foreground">Add up to 10 input and expected output pairs. Changing testcases requires students to pass again.</p>{form.testcases.map((test, index) => <div className="space-y-3 rounded-lg border p-4" key={index}><div className="flex items-center justify-between"><h3 className="font-medium">Testcase {index + 1}</h3><Button variant="ghost" size="sm" disabled={form.testcases.length === 1} onClick={() => setForm({ ...form, testcases: form.testcases.filter((_, i) => i !== index) })}>Remove</Button></div>{(["input", "expectedOutput"] as const).map(field => <label className="block space-y-2 font-medium" key={field}>{field === "input" ? "Input" : "Expected output"}<Textarea rows={3} className="font-mono" value={test[field]} onChange={e => setForm({ ...form, testcases: form.testcases.map((t, i) => i === index ? { ...t, [field]: e.target.value } : t) })} /></label>)}</div>)}<Button variant="outline" disabled={form.testcases.length >= 10} onClick={() => setForm({ ...form, testcases: [...form.testcases, { input: "", expectedOutput: "" }] })}>Add testcase</Button></div>];
  return <>{exercise && <><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-4xl">{exercise.title}</h1><Badge variant="secondary" className={`rounded-sm px-2 capitalize ${status === "PUBLISHED" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : ""}`}>{status?.toLowerCase()}</Badge></div><p className="text-sm text-muted-foreground">Edit the exercise and manage its availability.</p></div><div className="flex shrink-0"><Button size="lg" className="justify-start rounded-r-none px-3" disabled={busy || dirty} onClick={changeStatus}>{status === "PUBLISHED" ? <ArchiveIcon data-icon="inline-start" /> : <UploadSimpleIcon data-icon="inline-start" />}{status === "PUBLISHED" ? "Archive" : "Publish"}</Button><DropdownMenu><DropdownMenuTrigger render={<Button size="lg" aria-label="More exercise actions" className="rounded-l-none border-l-border/50 px-3" />}><CaretDownIcon /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem disabled={dirty} render={<Link href={`/exercises/${exercise.id}/submissions`} />}><UsersIcon /> Submissions</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>{dirty && <span className="text-xs text-muted-foreground">Save changes before publishing, archiving, or viewing submissions.</span>}</>}<div className={exercise ? "w-full space-y-5" : "max-w-4xl space-y-5"}>{exercise ? <Tabs value={steps[step]} onValueChange={value => { const index = steps.findIndex(s => s === value); if (index >= 0) setStep(index); }}><div className="flex flex-wrap items-center justify-between gap-3"><TabsList className="max-w-full overflow-x-auto">{steps.map(name => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}</TabsList><Button onClick={save} disabled={busy || !dirty}>Save changes</Button></div>{steps.map((name, i) => <TabsContent key={name} value={name}>{sections[i]}</TabsContent>)}</Tabs> : <><div className="flex flex-wrap gap-2" aria-label="Creation steps">{steps.map((name, i) => <span key={name} className={`rounded-md px-3 py-2 text-sm ${step === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}. {name}</span>)}</div><section className="rounded-lg border p-5"><h2 className="mb-4 text-xl">{steps[step]}</h2>{sections[step]}</section></>}{message && <p role="status" className="text-sm">{message}</p>}{!exercise && <div className="flex flex-wrap gap-2">{step > 0 && <Button variant="outline" onClick={() => { setStep(step - 1); setMessage(""); }}>Back</Button>}{step < steps.length - 1 ? <Button onClick={() => { if (step === 0 && !form.title.trim()) { setMessage("Enter a title to continue."); return; } setMessage(""); setStep(step + 1); }}>Next</Button> : <Button onClick={save} disabled={busy}>Create exercise</Button>}</div>}</div></>;
}
