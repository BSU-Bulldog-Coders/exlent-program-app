"use client";

import { useDeferredValue, useRef } from "react";
import {
  CodeIcon,
  EyeIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListChecksIcon,
  ListNumbersIcon,
  PencilSimpleIcon,
  QuotesIcon,
  TextBIcon,
  TextHOneIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
} from "@phosphor-icons/react";
import { MarkdownContent } from "@/components/announcements/markdown-content";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type MarkdownComposerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownComposer({ value, onChange }: MarkdownComposerProps) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const previewValue = useDeferredValue(value);

  function insert(prefix: string, suffix = prefix, placeholder = "text") {
    const element = textarea.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    onChange(next);
    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + selected.length;
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function prefixLines(prefix: string) {
    const element = textarea.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const selected = value.slice(lineStart, end) || "text";
    const next = `${value.slice(0, lineStart)}${selected
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n")}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => textarea.current?.focus());
  }

  return (
    <Tabs defaultValue="write" className="gap-0 overflow-hidden rounded-lg border">
      <div className="flex min-h-10 flex-wrap items-center gap-1 border-b bg-muted/30 p-1" aria-label="Markdown formatting">
        <div className="flex flex-wrap gap-1">
          <ToolButton label="Heading" onClick={() => prefixLines("## ")}><TextHOneIcon /></ToolButton>
          <ToolButton label="Bold" onClick={() => insert("**")}><TextBIcon /></ToolButton>
          <ToolButton label="Italic" onClick={() => insert("_")}><TextItalicIcon /></ToolButton>
          <ToolButton label="Strikethrough" onClick={() => insert("~~")}><TextStrikethroughIcon /></ToolButton>
          <ToolButton label="Link" onClick={() => insert("[", "](https://)", "link text")}><LinkSimpleIcon /></ToolButton>
          <ToolButton label="Quote" onClick={() => prefixLines("> ")}><QuotesIcon /></ToolButton>
          <ToolButton label="Inline code" onClick={() => insert("`")}><CodeIcon /></ToolButton>
          <ToolButton label="Bulleted list" onClick={() => prefixLines("- ")}><ListBulletsIcon /></ToolButton>
          <ToolButton label="Numbered list" onClick={() => prefixLines("1. ")}><ListNumbersIcon /></ToolButton>
          <ToolButton label="Task list" onClick={() => prefixLines("- [ ] ")}><ListChecksIcon /></ToolButton>
        </div>
        <TabsList className="ml-auto h-8! gap-0.5 rounded-md bg-muted/60 p-0.5">
          <ComposerTab value="write" label="Write"><PencilSimpleIcon /></ComposerTab>
          <ComposerTab value="preview" label="Preview"><EyeIcon /></ComposerTab>
        </TabsList>
      </div>
      <TabsContent value="write" className="m-0">
        <Textarea
          ref={textarea}
          id="announcement-body"
          name="body"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write an update for the program…"
          className="min-h-56 resize-y rounded-none! border-0! bg-background px-3.5 py-3 font-mono text-sm shadow-none focus-visible:ring-0"
          maxLength={20_000}
        />
      </TabsContent>
      <TabsContent value="preview" className="m-0 min-h-56 bg-background p-4">
        {previewValue.trim() ? (
          <MarkdownContent body={previewValue} />
        ) : (
          <p className="text-sm text-muted-foreground">Your Markdown preview will appear here.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ComposerTab({ value, label, children }: { value: "write" | "preview"; label: string; children: React.ReactNode }) {
  return (
      <Tooltip>
        <TooltipTrigger
          render={
            <TabsTrigger
              value={value}
              aria-label={label}
              className="h-7 flex-none rounded-sm border-0 px-2.5 py-1 data-active:bg-primary/10 data-active:text-primary data-active:shadow-none"
            >
              {children}
            </TabsTrigger>
          }
        />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" size="icon-xs" variant="ghost" onClick={onClick} title={label} aria-label={label}>
      {children}
    </Button>
  );
}
