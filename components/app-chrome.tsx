"use client";

import { Search } from "lucide-react";
import { openSearch } from "@/components/command-menu";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** First thing a keyboard user reaches: jump past the navigation. */
export function SkipLink() {
  const { dict } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only z-[70] rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
    >
      {dict.search.skip}
    </a>
  );
}

/** Opens the ⌘K search. */
export function SearchButton({ className }: { className?: string }) {
  const { dict } = useI18n();
  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label={dict.search.open}
      title={`${dict.search.open} (Ctrl K)`}
      className={cn("press flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground", className)}
    >
      <Search size={18} strokeWidth={1.9} />
    </button>
  );
}
