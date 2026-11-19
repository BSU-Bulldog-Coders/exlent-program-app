import Link from "next/link";
import { CodeIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExerciseRowActions } from "@/components/exercises/exercise-row-actions";
import type { ExerciseListItem } from "@/lib/exercise-list";

export function ExerciseTable({ exercises, isAdmin, returnTo }: { exercises: ExerciseListItem[]; isAdmin: boolean; returnTo?: string }) {
  return <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Classes</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>}</TableRow></TableHeader><TableBody>{exercises.map(item => <TableRow key={item.id}><TableCell className="font-medium"><Link className="hover:underline" href={returnTo ? `/exercises/${item.id}?${new URLSearchParams({ returnTo })}` : `/exercises/${item.id}`}>{item.title}</Link></TableCell><TableCell>{item.classes.map(c => c.class.name).join(", ") || "—"}</TableCell><TableCell><Badge variant="secondary">{isAdmin ? item.status.charAt(0) + item.status.slice(1).toLowerCase() : item.progress[0]?.passedRevisionId && item.progress[0].passedRevisionId === item.currentRevisionId ? "Passed" : item.progress.length ? "In progress" : "Not started"}</Badge></TableCell>{isAdmin && <TableCell className="text-right"><ExerciseRowActions id={item.id} title={item.title} /></TableCell>}</TableRow>)}{!exercises.length && <TableRow className="hover:bg-transparent"><TableCell colSpan={isAdmin ? 4 : 3}><Empty><EmptyHeader><EmptyMedia variant="icon"><CodeIcon /></EmptyMedia><EmptyTitle>No exercises yet</EmptyTitle><EmptyDescription>{isAdmin ? "Create an exercise to give students a place to practice." : "Exercises will appear here when they are published."}</EmptyDescription></EmptyHeader>{isAdmin && <Link className={buttonVariants()} href="/exercises/new"><PlusIcon /> New exercise</Link>}</Empty></TableCell></TableRow>}</TableBody></Table></div>;
}
