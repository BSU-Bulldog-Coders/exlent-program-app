"use client";

import { useDeferredValue, useState, type ReactNode } from "react";
import { InviteDialog } from "@/components/people/invite-dialog";
import { PeopleSearchContext, PeopleSearchInput } from "@/components/people/people-search";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { countMatchingNames } from "@/lib/people-search";

type Tab = "students" | "admins" | "deleted";

/**
 * Tabs, search and the invite button share one row. The button depends on the
 * active tab (invite a student vs. an admin), so the active tab lives here
 * while the tables themselves stay server-rendered and arrive as props.
 *
 * Search is entirely client side: the page loads every person once, and the
 * search box filters those rows by name as you type. The tables read the text
 * through PeopleSearchContext; `names` only feeds the tab counts.
 */
export function PeopleTabs({
  names,
  students,
  admins,
  deleted,
}: {
  names: { students: string[]; admins: string[]; deleted: string[] };
  students: ReactNode;
  admins: ReactNode;
  deleted: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("students");
  const [query, setQuery] = useState("");
  // Keeps typing responsive while a long list re-filters.
  const deferredQuery = useDeferredValue(query);

  return (
    <PeopleSearchContext value={deferredQuery}>
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="students">
            Students
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {countMatchingNames(names.students, deferredQuery)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admins
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {countMatchingNames(names.admins, deferredQuery)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Deleted Users
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {countMatchingNames(names.deleted, deferredQuery)}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex flex-wrap items-center gap-2">
          <PeopleSearchInput value={query} onChange={setQuery} />
          {tab === "deleted" ? null : <InviteDialog role={tab === "students" ? "STUDENT" : "ADMIN"} />}
        </div>
      </div>
      <TabsContent value="students">{students}</TabsContent>
      <TabsContent value="admins">{admins}</TabsContent>
      <TabsContent value="deleted">{deleted}</TabsContent>
    </Tabs>
    </PeopleSearchContext>
  );
}
