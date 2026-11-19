import { ArrowSquareOutIcon, FolderSimpleIcon, LinkIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type ClassResource = {
  id: string;
  title: string;
  description: string | null;
  kind: "FILE" | "YOUTUBE";
  originalName: string | null;
  youtubeUrl: string | null;
};

/** `canManage` is false for students: the same list, without the upload button. */
export function ClassResources({ classId, classes, resources, canManage = true }: { classId: string; classes: { id: string; name: string }[]; resources: ClassResource[]; canManage?: boolean }) {
  return <section className="flex flex-col gap-4">
    {canManage ? <div className="flex justify-end"><ResourceFormDialog classes={classes} initialClassId={classId} trigger={<Button size="sm"><PlusIcon data-icon="inline-start" />Upload resource</Button>} /></div> : null}
    {resources.length === 0 ? <Empty className="border"><EmptyHeader><EmptyMedia variant="icon"><FolderSimpleIcon /></EmptyMedia><EmptyTitle>No resources yet</EmptyTitle><EmptyDescription>{canManage ? "Upload a file or add a link for students to access from the Resources page." : "Nothing has been shared for this class yet."}</EmptyDescription></EmptyHeader></Empty> : <div className="rounded-lg border divide-y">{resources.map((resource) => <div key={resource.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate font-medium">{resource.kind === "FILE" ? <a href={`/api/resources/${resource.id}/file`} target="_blank" rel="noreferrer" className="hover:underline">{resource.title}</a> : resource.title}</p><p className="truncate text-sm text-muted-foreground">{resource.description || resource.originalName || "Web link"}</p></div>{resource.kind === "FILE" ? <Button size="sm" variant="outline" render={<a href={`/api/resources/${resource.id}/file`} target="_blank" rel="noreferrer"><ArrowSquareOutIcon data-icon="inline-start" />Open</a>} /> : <Button size="sm" variant="outline" render={<a href={resource.youtubeUrl ?? "#"} target="_blank" rel="noreferrer"><LinkIcon data-icon="inline-start" />Open</a>} />}</div>)}</div>}
  </section>;
}
