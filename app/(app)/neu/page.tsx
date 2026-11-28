"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { NewsArt } from "@/components/news";
import { PageHero } from "@/components/page-hero";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { markNewsSeen, NEWS } from "@/lib/news";

/** "What's new": everything that shipped, newest first. */
export default function NewsPage() {
  const { locale, dict } = useI18n();
  useEffect(() => markNewsSeen(), []);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero title={dict.news.title} subtitle={dict.news.subtitle} />
      <ol className="mt-8 flex flex-col gap-4">
        {NEWS.map((n, i) => {
          const body = (
            <>
              <NewsArt item={n} className="h-28 w-full shrink-0 sm:h-auto sm:w-44" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:p-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  {i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{dict.news.newBadge}</span>}
                  <time dateTime={n.date}>{formatDate(n.date, locale, { day: "numeric", month: "long", year: "numeric" })}</time>
                </p>
                <h2 className="font-display text-xl font-semibold">{n.title[locale]}</h2>
                <p className="text-muted-foreground">{n.text[locale]}</p>
                {n.href && (
                  <span className="mt-auto flex items-center gap-1 pt-1 text-sm font-semibold text-[var(--c-amber)]">
                    {dict.news.open}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                  </span>
                )}
              </div>
            </>
          );
          const cls = "enter group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card sm:flex-row";
          return (
            <li key={n.id} style={{ animationDelay: `${i * 50}ms` }}>
              {n.href ? (
                <Link href={n.href} className={`${cls} transition-colors hover:border-[var(--c-border-strong)]`}>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
