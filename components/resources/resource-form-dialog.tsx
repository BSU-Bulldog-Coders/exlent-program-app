"use client";

import { CaretDownIcon, FileArrowUpIcon, LinkIcon } from "@phosphor-icons/react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLinkResource } from "@/app/(app)/resources/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

type ClassOption = { id: string; name: string };
const PART_SIZE = 10 * 1024 * 1024;

function ClassPicker({ classes, value, onChange }: { classes: ClassOption[]; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = classes.find((item) => item.id === value);
  const matches = classes.filter((item) => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal"><span className="truncate">{selected?.name ?? "No class"}</span><CaretDownIcon /></Button>} />
    <PopoverContent align="start" className="w-(--anchor-width)">
      <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search classes…" />
      <div className="max-h-48 overflow-y-auto">
        <button type="button" className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent" onClick={() => { onChange(""); setOpen(false); }}>No class</button>
        {matches.map((item) => <button key={item.id} type="button" className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent" onClick={() => { onChange(item.id); setOpen(false); }}>{item.name}</button>)}
        {matches.length === 0 ? <p className="px-2 py-1.5 text-muted-foreground">No classes found.</p> : null}
      </div>
    </PopoverContent>
  </Popover>;
}

export function ResourceFormDialog({ classes, trigger, initialClassId }: { classes: ClassOption[]; trigger: React.ReactElement; initialClassId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choice" | "details">("choice");
  const [kind, setKind] = useState<"file" | "link">("file");
  const [classId, setClassId] = useState(initialClassId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() { setStep("choice"); setKind("file"); setClassId(initialClassId ?? ""); setFile(null); setProgress(null); setError(null); if (fileInput.current) fileInput.current.value = ""; }
  function values(form: HTMLFormElement) { const data = new FormData(form); return { title: String(data.get("title") ?? ""), description: String(data.get("description") ?? ""), classId: classId || null, url: String(data.get("url") ?? "") }; }

  async function uploadFile(details: ReturnType<typeof values>, selected: File) {
    const response = await fetch("/api/resources/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...details, announcementId: null, file: { name: selected.name, type: selected.type, size: selected.size } }) });
    const prepared = await response.json().catch(() => null); if (!response.ok || !prepared) throw new Error("Could not prepare the upload.");
    try {
      if (prepared.mode === "single") {
        const result = await fetch(prepared.uploadUrl, { method: "PUT", headers: { "Content-Type": selected.type }, body: selected }); if (!result.ok) throw new Error("The file upload failed.");
        const finalized = await fetch(`/api/resources/upload/${prepared.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); const completed = await finalized.json(); if (!finalized.ok) throw new Error(completed.error ?? "Could not finalize the upload.");
      } else {
        const parts: { partNumber: number; etag: string }[] = []; const count = Math.ceil(selected.size / PART_SIZE);
        for (let index = 0; index < count; index += 1) {
          const part = await fetch(`/api/resources/upload/${prepared.id}/part`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partNumber: index + 1 }) }); const signed = await part.json(); if (!part.ok) throw new Error(signed.error ?? "Could not prepare an upload part.");
          const result = await fetch(signed.uploadUrl, { method: "PUT", body: selected.slice(index * PART_SIZE, Math.min(selected.size, (index + 1) * PART_SIZE)) }); const etag = result.headers.get("etag"); if (!result.ok || !etag) throw new Error("A file part failed to upload."); parts.push({ partNumber: index + 1, etag }); setProgress(Math.round(((index + 1) / count) * 100));
        }
        const finalized = await fetch(`/api/resources/upload/${prepared.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parts }) }); const result = await finalized.json(); if (!finalized.ok) throw new Error(result.error ?? "Could not finalize the upload.");
      }
    } catch (uploadError) { await fetch(`/api/resources/upload/${prepared.id}/abort`, { method: "DELETE" }).catch(() => undefined); throw uploadError; }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const details = values(event.currentTarget); setError(null); setProgress(kind === "file" ? 0 : null); startTransition(async () => { try { if (kind === "link") { const result = await createLinkResource(details); if (!result.ok) { setError(result.error); return; } } else { if (!file) { setError("Choose a file to upload."); return; } await uploadFile(details, file); } toast.success("Resource published."); setOpen(false); reset(); router.refresh(); } catch { setError("Could not save the resource. Please try again."); } }); }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) reset(); }}>
    <DialogTrigger render={trigger} />
    <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
      {step === "choice" ? <>
        <DialogHeader><DialogTitle>Add resource</DialogTitle><DialogDescription>Choose how you want to share this resource.</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <Button type="button" variant="outline" className="h-auto justify-start gap-3 p-4 text-left" onClick={() => { setKind("file"); setStep("details"); }}>
            <FileArrowUpIcon className="size-6" />
            <span className="flex flex-col items-start gap-0.5"><span>Upload file</span><span className="text-xs font-normal text-muted-foreground">Share a document, image, video, or audio file.</span></span>
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-3 p-4 text-left" onClick={() => { setKind("link"); setStep("details"); }}>
            <LinkIcon className="size-6" />
            <span className="flex flex-col items-start gap-0.5"><span>Add link</span><span className="text-xs font-normal text-muted-foreground">Share a website, video, or other online resource.</span></span>
          </Button>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button></DialogFooter>
      </> : <form onSubmit={submit} className="grid gap-4"><DialogHeader><DialogTitle>{kind === "file" ? "Upload file" : "Add link"}</DialogTitle><DialogDescription>{kind === "file" ? "Share a permitted file with signed-in program members." : "Share a web link. YouTube videos play directly in the app."}</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel htmlFor="resource-title">Title</FieldLabel><Input id="resource-title" name="title" required maxLength={160} placeholder={kind === "file" ? "Week 1 slides" : "Recommended reading"} /></Field><Field><FieldLabel htmlFor="resource-description">Description (optional)</FieldLabel><Textarea id="resource-description" name="description" maxLength={2000} /></Field>{kind === "file" ? <Field><FieldLabel htmlFor="resource-file">File</FieldLabel><Input ref={fileInput} id="resource-file" type="file" accept=".docx,.pptx,.xlsx,.pdf,image/*,video/*,audio/*" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Up to 500 MB. Files over 50 MB upload in parts.</p></Field> : <Field><FieldLabel htmlFor="resource-url">Link</FieldLabel><Input id="resource-url" name="url" type="url" required placeholder="https://example.com/resource" /></Field>}<Field><FieldLabel>Class (optional)</FieldLabel><ClassPicker classes={classes} value={classId} onChange={setClassId} /></Field></FieldGroup>{progress !== null ? <p className="text-sm text-muted-foreground">Uploading… {progress}%</p> : null}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => setStep("choice")}>Back</Button><Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Publish resource"}</Button></DialogFooter></form>}
    </DialogContent>
  </Dialog>;
}
