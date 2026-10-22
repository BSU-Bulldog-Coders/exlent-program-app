import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Building blocks for loading.tsx files. Each mirrors the markup and classes of
// the real page so nothing shifts when the data arrives: static copy renders as
// text, and only values from the session or database are skeletons. Skeletons
// that sit inside text use inline-block + em/line-height sizing so they share
// the same line box as the real content.

/** Same look as the page's back link, without being clickable. */
export function BackLinkSkeleton({ label }: { label: string }) {
  return (
    <span className="flex w-fit items-center gap-1 text-sm text-muted-foreground">
      <ArrowLeftIcon className="size-4" /> {label}
    </span>
  );
}

/** A skeleton that sits inside a line of text of the surrounding size. */
export function InlineSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("inline-block align-middle", className)} />;
}

export type SkeletonColumn = {
  label: string;
  /** Width class for the placeholder in each row. */
  width: string;
  align?: "right";
  pill?: boolean;
  /** Overrides the default h-4 placeholder height (e.g. h-7 for a small button). */
  height?: string;
};

export function TableSkeleton({ columns, rows = 5 }: { columns: SkeletonColumn[]; rows?: number }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.label} className={column.align === "right" ? "text-right" : undefined}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row}>
              {columns.map((column) => (
                <TableCell key={column.label}>
                  <Skeleton
                    className={cn(
                      column.height ?? "h-4",
                      column.width,
                      column.pill && "h-6 rounded-full",
                      column.align === "right" && "ml-auto",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function StatCardSkeleton({ label, caption }: { label: string; caption?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">
          <InlineSkeleton className="h-[0.8em] w-12" />
        </CardTitle>
      </CardHeader>
      {caption ? <CardContent className="text-sm text-muted-foreground">{caption}</CardContent> : null}
    </Card>
  );
}

export function FieldSkeleton({ label, htmlFor }: { label: string; htmlFor: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      <Skeleton className="h-10 w-full rounded-lg" />
    </Field>
  );
}
