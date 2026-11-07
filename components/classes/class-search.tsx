"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;
const WRAPPER = "relative w-full sm:w-72";
const INPUT = "pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden";

/**
 * Search box that keeps `?q=` in the URL. The list is rendered on the server, so
 * each change is a soft navigation: no full reload, the input keeps focus, and
 * `replace` keeps the back button from filling up with one entry per keystroke.
 */
export function ClassSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Follow the URL when it changes from outside (back button, link).
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (seenUrlQuery !== urlQuery) {
    setSeenUrlQuery(urlQuery);
    setValue(urlQuery);
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  function push(next: string) {
    const trimmed = next.trim();
    if (trimmed === urlQuery) return;
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page"); // a new search starts from page 1
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function change(next: string, immediate = false) {
    setValue(next);
    clearTimeout(timer.current);
    if (immediate) push(next);
    else timer.current = setTimeout(() => push(next), DEBOUNCE_MS);
  }

  return (
    <div className={WRAPPER} role="search">
      <MagnifyingGlassIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") change(value, true);
          if (event.key === "Escape") change("", true);
        }}
        placeholder="Search by class name"
        aria-label="Search classes by name"
        autoComplete="off"
        className={INPUT}
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={() => change("", true)}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

/** Same box, inert: the Suspense fallback and the loading.tsx version. */
export function ClassSearchSkeleton() {
  return (
    <div className={WRAPPER}>
      <MagnifyingGlassIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        disabled
        placeholder="Search by class name"
        aria-label="Search classes by name"
        className={INPUT}
      />
    </div>
  );
}
