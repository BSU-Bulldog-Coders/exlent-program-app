import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function AnnouncementFeed() {
  const user = await requireUser();
  const announcementsPromise = prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      classId: true,
      createdAt: true,
      author: { select: { name: true } },
      class: { select: { name: true } },
      resources: { where: { uploadStatus: "READY" }, select: { id: true, title: true, kind: true, youtubeUrl: true } },
    },
  });
  const classesPromise = user.role === "ADMIN"
    ? prisma.class.findMany({ orderBy: { startsAt: "desc" }, select: { id: true, name: true } })
    : Promise.resolve([]);
  const resourcesPromise = user.role === "ADMIN" ? prisma.resource.findMany({ where: { uploadStatus: "READY" }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }) : Promise.resolve([]);
  const [announcements, classes, resources] = await Promise.all([announcementsPromise, classesPromise, resourcesPromise]);

  return (
    <>
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          There are no announcements yet.
          {user.role === "ADMIN" && (
            <p className="mt-2 text-xs">Create classes and post announcements to keep students informed.</p>
          )}
        </div>      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              canManage={user.role === "ADMIN"}
              classes={classes}
              resources={resources}
            />
          ))}
        </div>
      )}
    </>
  );
}
