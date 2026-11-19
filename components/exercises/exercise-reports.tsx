"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
type Report = { id: string; reason: string; status: string; user: { name: string }; testcase: { position: number; input: string; expectedOutput: string; exercise: { id: string; title: string } } };
export function ExerciseReports({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [error, setError] = useState("");
  async function update(id: string, status: string) { try { const response = await fetch(`/api/admin/testcase-reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error("Could not update report."); setReports(old => old.map(report => report.id === id ? { ...report, status } : report)); setError(""); } catch (e) { setError((e as Error).message); } }
  return <>{error && <p role="alert">{error}</p>}<div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Exercise</TableHead><TableHead>Student</TableHead><TableHead>Report</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{reports.map(report => <TableRow key={report.id}><TableCell><Link className="font-medium hover:underline" href={`/exercises/${report.testcase.exercise.id}`}>{report.testcase.exercise.title}</Link><p className="text-xs text-muted-foreground">Testcase {report.testcase.position + 1}</p></TableCell><TableCell>{report.user.name}</TableCell><TableCell><p>{report.reason}</p><details className="text-xs"><summary>Testcase details</summary><pre className="whitespace-pre-wrap">{`Input: ${report.testcase.input}\nExpected: ${report.testcase.expectedOutput}`}</pre></details></TableCell><TableCell><p>{report.status}</p>{report.status === "OPEN" && <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => update(report.id, "RESOLVED")}>Resolve</Button><Button size="sm" variant="ghost" onClick={() => update(report.id, "DISMISSED")}>Dismiss</Button></div>}</TableCell></TableRow>)}{!reports.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No reports yet.</TableCell></TableRow>}</TableBody></Table></div></>;
}
