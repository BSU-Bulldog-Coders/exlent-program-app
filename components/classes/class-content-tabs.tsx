import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ClassContentTabs({ resources, exercises }: { resources: ReactNode; exercises: ReactNode }) {
  return <Tabs defaultValue="resources" className="gap-4"><TabsList><TabsTrigger value="resources">Resources</TabsTrigger><TabsTrigger value="exercises">Exercises</TabsTrigger></TabsList><TabsContent value="resources">{resources}</TabsContent><TabsContent value="exercises">{exercises}</TabsContent></Tabs>;
}
