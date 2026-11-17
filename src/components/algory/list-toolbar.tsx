"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Search box that reports its value after the user stops typing. */
export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  delayMs = 350,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  delayMs?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Follow outside resets (e.g. "Temizle") without an effect.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => onChangeRef.current(draft.trim()), delayMs);
    return () => clearTimeout(timer);
  }, [draft, value, delayMs]);

  return (
    <div className={cn("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChangeRef.current(draft.trim());
        }}
        className="h-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        autoComplete="off"
      />
      {draft ? (
        <button
          type="button"
          aria-label="Aramayı temizle"
          onClick={() => {
            setDraft("");
            onChangeRef.current("");
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export type FilterOption<T extends string> = { value: T; label: string };

/** Compact select whose trigger reads "Label: value"; highlighted when it differs from the default. */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  defaultValue,
  className,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  defaultValue?: T;
  className?: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  const changed = defaultValue !== undefined && value !== defaultValue;
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-8 max-w-full",
          changed && "border-foreground/30 bg-muted/60 dark:bg-muted/40",
          className,
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue>
          <span className="truncate font-medium">{current}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Pill tabs with counts used as the primary filter of a list. */
export function SegmentTabs<T extends string>({
  value,
  items,
  onChange,
  ariaLabel,
}: {
  value: T | null;
  items: { value: T; label: string; count?: number; tone?: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.tone && !active ? (
              <span className={cn("size-1.5 rounded-full", item.tone)} />
            ) : null}
            {item.label}
            {item.count != null ? (
              <span
                className={cn(
                  "rounded px-1 text-xs tabular-nums",
                  active ? "bg-background/20" : "bg-muted",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** "1–20 / 57" plus previous/next. */
export function Pager({
  page,
  size,
  total,
  hasNext,
  disabled,
  onPage,
  unit,
}: {
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
  disabled?: boolean;
  onPage: (page: number) => void;
  unit: string;
}) {
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, total);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5">
      <p className="text-xs text-muted-foreground tabular-nums">
        {total === 0 ? `0 ${unit}` : `${from}–${to} / ${total} ${unit}`}
      </p>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Önceki sayfa"
          disabled={disabled || page === 0}
          onClick={() => onPage(Math.max(page - 1, 0))}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Sonraki sayfa"
          disabled={disabled || !hasNext}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
