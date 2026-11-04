import { DotsThreeIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mirrors <PeopleTabs> and the Students table in app/(app)/admin/people/page.tsx.
// Labels, headers and the invite button render as-is; only the counts and row
// data (which come from the database) are skeletons.
const ROWS = 5;

export function PeopleSkeleton() {
  return (
    <Tabs defaultValue="students" className="gap-4">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="students">
            Students
            <Badge variant="outline" className="h-5 min-w-5 px-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admins
            <Badge variant="outline" className="h-5 min-w-5 px-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted Users
            <Badge variant="outline" className="h-5 min-w-5 px-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </Badge>
          </TabsTrigger>
        </TabsList>
        <Button disabled>
          <UserPlusIcon data-icon="inline-start" />
          Invite student
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Attendance</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: ROWS }, (_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Button className="ml-auto" size="icon-sm" variant="ghost" disabled aria-label="User actions">
                    <DotsThreeIcon weight="bold" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Tabs>
  );
}
