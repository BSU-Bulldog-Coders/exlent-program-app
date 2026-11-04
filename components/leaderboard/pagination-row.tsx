import { Button } from "@/components/ui/button";

/** Shared by the live page and its skeleton (buttons are disabled there). */
export function PaginationRow({
  page,
  pages,
  prev,
  next,
}: {
  page?: number;
  pages?: number;
  prev?: React.ReactElement;
  next?: React.ReactElement;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" size="sm" disabled={!prev} render={prev}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        {page !== undefined && pages !== undefined ? `Page ${page} of ${pages}` : "Page"}
      </span>
      <Button variant="outline" size="sm" disabled={!next} render={next}>
        Next
      </Button>
    </div>
  );
}
