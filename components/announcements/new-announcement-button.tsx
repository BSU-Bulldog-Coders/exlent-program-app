import { PlusIcon } from "@phosphor-icons/react/ssr";
import { AnnouncementFormDialog } from "@/components/announcements/announcement-form-dialog";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const newAnnouncementButtonClassName =
  "fixed right-6 bottom-6 z-40 size-12 rounded-full p-0 shadow-md md:static md:h-10 md:w-auto md:rounded-lg md:px-5 md:shadow-none";

export async function NewAnnouncementButton() {
  const user = await requireUser();
  if (user.role !== "ADMIN") return null;

  const [preference, classes, resources] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { announcementEmailDefault: true } }),
    prisma.class.findMany({ orderBy: { startsAt: "desc" }, select: { id: true, name: true } }),
    prisma.resource.findMany({ where: { uploadStatus: "READY" }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <AnnouncementFormDialog
      classes={classes}
      resources={resources}
      defaultEmailRequested={preference?.announcementEmailDefault ?? false}
      trigger={<NewAnnouncementTrigger />}
    />
  );
}

function NewAnnouncementTrigger() {
  return (
    <Button className={newAnnouncementButtonClassName}>
      <PlusIcon data-icon="inline-start" />
      <span className="hidden md:inline">New announcement</span>
      <span className="sr-only md:hidden">New announcement</span>
    </Button>
  );
}
