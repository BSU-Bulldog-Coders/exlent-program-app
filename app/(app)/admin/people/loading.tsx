import { PeopleHeader } from "@/components/people/people-header";
import { PeopleSkeleton } from "@/components/people/people-skeleton";

export default function Loading() {
  return (
    <>
      <PeopleHeader />
      <PeopleSkeleton />
    </>
  );
}
