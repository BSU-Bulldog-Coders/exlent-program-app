import { CaretDownIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { TableSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { ExercisesHeader } from "@/components/exercises/exercises-header";
export function ExerciseSkeleton() { return <div className="space-y-4"><div className="flex flex-wrap justify-end gap-3"><div className="flex shrink-0"><Button size="lg" className="justify-start rounded-r-none px-3" disabled><PlusIcon data-icon="inline-start" /> New exercise</Button><Button size="lg" aria-label="More exercise actions" className="rounded-l-none border-l-border/50 px-3" disabled><CaretDownIcon /></Button></div></div><TableSkeleton columns={[{ label: "Title", width: "w-40" }, { label: "Classes", width: "w-32" }, { label: "Status", width: "w-20", pill: true }, { label: "", width: "w-7", align: "right" }]} /></div>; }
export default function Loading() { return <><ExercisesHeader /><ExerciseSkeleton /></>; }
