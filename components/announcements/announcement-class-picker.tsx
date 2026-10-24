"use client";

import { useMemo, useState } from "react";
import { CaretDownIcon, CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AnnouncementClassOption } from "@/components/announcements/announcement-form-dialog";

const DEFAULT_CLASS_COUNT = 5;
const ALL_PARTICIPANTS = "All program participants";

export function AnnouncementClassPicker({
  id,
  classes,
  value,
  onValueChange,
}: {
  id: string;
  classes: AnnouncementClassOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedClass = classes.find((item) => item.id === value);
  const isSearching = query.trim().length > 0;
  const visibleClasses = useMemo(() => {
    if (!isSearching) return classes.slice(0, DEFAULT_CLASS_COUNT);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return classes.filter((item) => item.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [classes, isSearching, query]);

  function select(value: string) {
    onValueChange(value);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between px-3.5 font-normal"
          >
            <span className="truncate">{selectedClass?.name ?? ALL_PARTICIPANTS}</span>
            <CaretDownIcon className="text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) max-w-[calc(100vw-2rem)] gap-2 p-2">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search classes…"
            className="h-9 pl-8"
          />
        </div>
        <div role="listbox" aria-label="Classes" className="max-h-64 overflow-y-auto overscroll-contain pr-1">
          <ClassOption selected={!value} onSelect={() => select("")}>
            {ALL_PARTICIPANTS}
          </ClassOption>
          {visibleClasses.map((item) => (
            <ClassOption key={item.id} selected={value === item.id} onSelect={() => select(item.id)}>
              {item.name}
            </ClassOption>
          ))}
          {isSearching && visibleClasses.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">No classes match that search.</p>
          ) : null}
        </div>
        {!isSearching && classes.length > DEFAULT_CLASS_COUNT ? (
          <p className="px-2.5 pb-1 text-xs text-muted-foreground">Search to find more classes.</p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function ClassOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="h-9 w-full justify-between px-2.5 text-left font-normal"
    >
      <span className="truncate">{children}</span>
      {selected ? <CheckIcon className="size-4 text-primary" /> : null}
    </Button>
  );
}
