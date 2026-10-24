import { CalendarDotsIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { AnnouncementCardActions } from "@/components/announcements/announcement-card-actions";
import type { AnnouncementClassOption } from "@/components/announcements/announcement-form-dialog";
import { MarkdownContent } from "@/components/announcements/markdown-content";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export type AnnouncementCardData = {
  id: string;
  title: string;
  body: string;
  classId: string | null;
  createdAt: Date;
  author: { name: string };
  class: { name: string } | null;
};

export function AnnouncementCard({
  announcement,
  classes,
  canManage = false,
}: {
  announcement: AnnouncementCardData;
  classes?: AnnouncementClassOption[];
  canManage?: boolean;
}) {
  return (
    <Card className="[--card-spacing:--spacing(4)]">
      <CardHeader className="gap-1">
        <CardTitle>{announcement.title}</CardTitle>
        <CardDescription className="leading-tight">
          Posted by {announcement.author.name} on {formatDate(announcement.createdAt)}
        </CardDescription>
        {canManage ? (
          <CardAction className="self-center">
            <AnnouncementCardActions announcement={announcement} classes={classes ?? []} />
          </CardAction>
        ) : null}
        {announcement.class && announcement.classId ? (
          <Badge
            variant="secondary"
            render={<Link href={`/classes/${announcement.classId}`} />}
            className="mt-1.5 cursor-pointer underline-offset-4 hover:underline"
          >
            <CalendarDotsIcon data-icon="inline-start" />
            {announcement.class.name}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        <MarkdownContent body={announcement.body} />
      </CardContent>
    </Card>
  );
}
