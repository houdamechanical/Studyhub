"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ContentCard } from "@/components/library/content-card";
import type { ContentItem } from "@/lib/content";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatPageCount } from "@/lib/i18n/dictionaries";
import { SUBJECT_IDS, SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** Lowercase and strip accents so "stromstarke" finds "Stromstärke". */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");
}

export function LibraryBrowser({ items }: { items: ContentItem[] }) {
  const { dict } = useI18n();
  const [query, setQuery] = useState("");

  // One searchable string per item: title, topic, tags and subject names in all languages.
  const haystacks = useMemo(
    () =>
      items.map((item) =>
        normalize(
          [
            item.title,
            item.topic,
            item.semester,
            ...item.tags,
            ...Object.values(SUBJECTS[item.subject].label),
          ].join(" "),
        ),
      ),
    [items],
  );

  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const results =
    terms.length === 0
      ? []
      : items.filter((_, i) => terms.every((term) => haystacks[i].includes(term)));

  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.subject, (counts.get(item.subject) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.library.searchPlaceholder}
          aria-label={dict.library.searchLabel}
          className="h-11 w-full rounded-xl border bg-card ps-10 pe-10 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {terms.length > 0 ? (
        <section aria-live="polite" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? fill(dict.library.noResults, { q: query.trim() })
              : fill(dict.library.results, { n: results.length })}
          </p>
          {results.map((item) => (
            <ContentCard key={item.id} item={item} showSubject />
          ))}
        </section>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SUBJECT_IDS.map((id) => {
            const subject = SUBJECTS[id];
            const count = counts.get(id) ?? 0;
            return (
              <li key={id}>
                <SubjectTile id={id} count={count} emoji={subject.emoji} color={subject.color} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SubjectTile({
  id,
  count,
  emoji,
  color,
}: {
  id: (typeof SUBJECT_IDS)[number];
  count: number;
  emoji: string;
  color: string;
}) {
  const { locale, dict } = useI18n();
  return (
    <Link
      href={`/library/${id}`}
      style={{ "--subject": color } as React.CSSProperties}
      className={cn(
        "relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 transition-colors hover:bg-accent",
        count === 0 && "opacity-60",
      )}
    >
      <span
        className="flex size-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--subject)_15%,transparent)] text-xl"
        aria-hidden
      >
        {emoji}
      </span>
      <span>
        <span className="block font-medium">{SUBJECTS[id].label[locale]}</span>
        <span className="block text-xs text-muted-foreground">{formatPageCount(count, dict)}</span>
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1 bg-[var(--subject)]" aria-hidden />
    </Link>
  );
}
