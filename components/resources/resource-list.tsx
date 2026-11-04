import { ArrowSquareOutIcon, LinkIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { ResourceActions } from "@/components/resources/resource-actions";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isYouTubeEmbedUrl } from "@/lib/resources";

function resourceTypeLabel(resource: { kind: "FILE" | "YOUTUBE"; contentType: string | null; youtubeUrl: string | null }) {
  if (resource.kind === "YOUTUBE") return isYouTubeEmbedUrl(resource.youtubeUrl) ? "YouTube" : "Link";
  switch (resource.contentType) {
    case "application/pdf": return "PDF";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return "Word document";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation": return "Presentation";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": return "Spreadsheet";
    default: {
      const family = resource.contentType?.split("/")[0];
      return family === "image" ? "Image" : family === "video" ? "Video" : family === "audio" ? "Audio" : "File";
    }
  }
}

export async function ResourceList() {
  const user = await requireUser();
  const [resources, classes] = await Promise.all([
    prisma.resource.findMany({ where: { uploadStatus: "READY" }, orderBy: { createdAt: "desc" }, include: { class: { select: { id: true, name: true } }, announcement: { select: { id: true, title: true } } } }),
    user.role === "ADMIN" ? prisma.class.findMany({ orderBy: { startsAt: "desc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-4xl">Resources</h1><p className="text-sm text-muted-foreground">Files, recordings, and links shared with the program.</p></div>
        {user.role === "ADMIN" ? <ResourceFormDialog classes={classes} trigger={<Button><PlusIcon data-icon="inline-start" />New</Button>} /> : null}
      </div>
      {resources.length === 0 ? <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No resources have been shared yet.</div> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>
                  {resource.kind === "FILE" ? <a href={`/api/resources/${resource.id}/file`} target="_blank" rel="noreferrer" className="hover:underline">{resource.title}</a> : resource.title}
                </CardTitle>
                <CardDescription>{resource.description || (resource.kind === "YOUTUBE" ? "Web link" : resource.originalName)}</CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">{resourceTypeLabel(resource)}</Badge>
                  {resource.class ? <Badge variant="outline">Class: {resource.class.name}</Badge> : null}
                  {resource.announcement ? <Badge variant="outline">Announcement: {resource.announcement.title}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {resource.kind === "YOUTUBE" && isYouTubeEmbedUrl(resource.youtubeUrl) ? <iframe className="aspect-video w-full rounded-md border" src={resource.youtubeUrl ?? undefined} title={resource.title} allowFullScreen /> : null}
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between gap-2">
                <span className="text-xs text-muted-foreground">Shared {formatDate(resource.createdAt)}</span>
                <div className="flex gap-2">
                  {resource.kind === "FILE" ? <Button size="sm" variant="outline" render={<a href={`/api/resources/${resource.id}/file`} target="_blank" rel="noreferrer"><ArrowSquareOutIcon data-icon="inline-start" />Open</a>} /> : <Button size="sm" variant="outline" render={<a href={resource.youtubeUrl ?? "#"} target="_blank" rel="noreferrer"><LinkIcon data-icon="inline-start" />Open</a>} />}
                  {user.role === "ADMIN" ? <ResourceActions id={resource.id} title={resource.title} /> : null}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
