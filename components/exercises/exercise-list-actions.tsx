"use client";

import Link from "next/link";
import { CaretDownIcon, FlagIcon, PlusIcon } from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ExerciseListActions() {
  return (
    <div className="flex shrink-0">
      <Link href="/exercises/new" className={buttonVariants({ size: "lg", className: "justify-start rounded-r-none px-3" })}>
        <PlusIcon data-icon="inline-start" /> New exercise
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="lg" aria-label="More exercise actions" className="rounded-l-none border-l-border/50 px-3" />}>
          <CaretDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link href="/exercises/reports" />}><FlagIcon /> Testcase reports</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
