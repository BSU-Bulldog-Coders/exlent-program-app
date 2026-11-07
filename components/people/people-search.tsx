"use client";

import { createContext, Fragment, use, useMemo, type ReactNode } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { filterByName, isSearching } from "@/lib/people-search";

// The tables are rendered on the server and handed to <PeopleTabs>, so they
// cannot receive the search text as a prop. PeopleTabs provides it here and the
// client pieces below (rendered inside those server tables) read it.
export const PeopleSearchContext = createContext("");

export function PeopleSearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? "w-full sm:w-64"}`}>
      <MagnifyingGlassIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onChange("");
        }}
        placeholder="Search by name"
        aria-label="Search people by name"
        autoComplete="off"
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

export type SearchableRow = {
  id: string;
  /** The only text the search looks at. */
  name: string;
  /** The row, rendered on the server. */
  node: ReactNode;
};

/** Renders the rows whose name matches the search, or a "no matches" row. */
export function SearchableRows({
  rows,
  colSpan,
  noun,
}: {
  rows: SearchableRow[];
  colSpan: number;
  /** Plural label for the empty-result message, e.g. "students". */
  noun: string;
}) {
  const query = use(PeopleSearchContext);
  const visible = useMemo(() => filterByName(rows, query), [rows, query]);

  if (isSearching(query) && visible.length === 0) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={colSpan}>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MagnifyingGlassIcon />
              </EmptyMedia>
              <EmptyTitle>
                No {noun} match &ldquo;{query.trim()}&rdquo;.
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        </TableCell>
      </TableRow>
    );
  }
  return visible.map((row) => <Fragment key={row.id}>{row.node}</Fragment>);
}

/** For rows with no name to search (pending invites, empty-list messages): hidden while a search is active. */
export function HideWhileSearching({ children }: { children: ReactNode }) {
  return isSearching(use(PeopleSearchContext)) ? null : children;
}
