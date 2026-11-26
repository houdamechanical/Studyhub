"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ContentItem } from "@/lib/content";
import { useI18n } from "@/lib/i18n/client";
import { formatSemester } from "@/lib/i18n/dictionaries";
import { SUBJECTS } from "@/lib/subjects";

export function ContentCard({
  item,
  showSubject = false,
}: {
  item: ContentItem;
  showSubject?: boolean;
}) {
  const { locale, dict } = useI18n();
  const subject = SUBJECTS[item.subject];

  return (
    <Link
      href={`/library/${item.subject}/${item.id}`}
      className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
      style={{ "--subject": subject.color } as React.CSSProperties}
    >
      <span className="h-10 w-1 shrink-0 self-stretch rounded-full bg-[var(--subject)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug" lang="de" dir="auto">
          {item.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {showSubject && (
            <>
              {subject.emoji} {subject.label[locale]} ·{" "}
            </>
          )}
          {dict.kind[item.kind]}
          {showSubject && <> · {formatSemester(item.semester, dict)}</>}
        </p>
        {item.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" lang="de">
            {item.tags.slice(0, 5).map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
            {item.tags.length > 5 && (
              <li className="px-1 text-[11px] text-muted-foreground">+{item.tags.length - 5}</li>
            )}
          </ul>
        )}
      </div>
      <ChevronRight
        size={18}
        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
