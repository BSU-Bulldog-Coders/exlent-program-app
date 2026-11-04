"use client";

import { useState, type ReactNode } from "react";
import { InviteDialog } from "@/components/people/invite-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "students" | "admins" | "deleted";

/**
 * Tabs and the invite button share one row. The button depends on the active
 * tab (invite a student vs. an admin), so the active tab lives here while the
 * tables themselves stay server-rendered and arrive as props.
 */
export function PeopleTabs({
  studentCount,
  adminCount,
  deletedCount,
  students,
  admins,
  deleted,
}: {
  studentCount: number;
  adminCount: number;
  deletedCount: number;
  students: ReactNode;
  admins: ReactNode;
  deleted: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("students");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="students">
            Students
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {studentCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admins
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {adminCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted Users
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {deletedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
        {tab === "deleted" ? null : <InviteDialog role={tab === "students" ? "STUDENT" : "ADMIN"} />}
      </div>
      <TabsContent value="students">{students}</TabsContent>
      <TabsContent value="admins">{admins}</TabsContent>
      <TabsContent value="deleted">{deleted}</TabsContent>
    </Tabs>
  );
}
