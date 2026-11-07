import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { classListHref, type ClassListParams } from "@/lib/class-list-params";

/** Table footer with previous / page number / next at the bottom right. Links, so it works without JS and keeps the URL as the source of truth. */
export function ClassPagination({
  basePath,
  params,
  pageCount,
  colSpan,
}: {
  basePath: string;
  /** The effective page, plus the pageSize and q to carry along. */
  params: ClassListParams;
  pageCount: number;
  colSpan: number;
}) {
  const { page } = params;
  const prev = page > 1;
  const next = page < pageCount;
  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={colSpan}>
          <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
            {prev ? (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                render={<Link href={classListHref(basePath, { ...params, page: page - 1 })} scroll={false} />}
              >
                <CaretLeftIcon />
              </Button>
            ) : (
              <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled>
                <CaretLeftIcon />
              </Button>
            )}
            <span className="min-w-8 text-center text-sm tabular-nums" aria-current="page">
              {page}
            </span>
            {next ? (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                render={<Link href={classListHref(basePath, { ...params, page: page + 1 })} scroll={false} />}
              >
                <CaretRightIcon />
              </Button>
            ) : (
              <Button variant="outline" size="icon-sm" aria-label="Next page" disabled>
                <CaretRightIcon />
              </Button>
            )}
          </nav>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}

/** Footer for loading skeletons: same height, inert buttons. */
export function ClassPaginationSkeleton({ colSpan }: { colSpan: number }) {
  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={colSpan}>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled>
              <CaretLeftIcon />
            </Button>
            <span className="flex min-w-8 justify-center">
              <Skeleton className="h-4 w-3" />
            </span>
            <Button variant="outline" size="icon-sm" aria-label="Next page" disabled>
              <CaretRightIcon />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}
