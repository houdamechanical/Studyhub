"use client";

import {
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  Gamepad2,
  Layers,
  ListChecks,
  MousePointerClick,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProgressBar } from "@/components/progress-bar";
import { SubjectBook } from "@/components/subject-book";
import { subjectProgress } from "@/lib/progress";
import { getContentForSubject, type ContentKind } from "@/lib/content";
import { useLoad } from "@/lib/data";
import { formatDate, todayISO } from "@/lib/format";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { daysUntil, dueCount, loadPractice, loadSchoolExams } from "@/lib/loaders";
import { gradeHref, PRACTICE_SEMESTER, semesterHref, splitSemester } from "@/lib/school";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ContentKind, LucideIcon> = {
  notes: FileText,
  quiz: Gamepad2,
  interactive: MousePointerClick,
};

const TABS = ["pages", "mini", "mock", "cards"] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string): v is Tab => (TABS as readonly string[]).includes(v);

async function loadSubject(subject: SubjectId, withPractice: boolean) {
  const [practice, exams] = await Promise.all([
    withPractice ? loadPractice(subject) : Promise.resolve({ quizList: [], deckList: [] }),
    loadSchoolExams([subject], { subject }),
  ]);
  return { ...practice, exams };
}

/**
 * /grade/11/1/bio – one subject in one half-year. Every subject has exactly
 * this layout: a short header, then tabs for study pages, mini tests, mock
 * exams and flashcards (the tab is kept in the URL hash, e.g. #mini).
 */
export function SubjectPage({ semester, subject }: { semester: string; subject: SubjectId }) {
  const { locale, dict } = useI18n();
  const t = dict.subject;
  const info = SUBJECTS[subject];
  useTitle(info.label[locale]);
  const { grade, half } = splitSemester(semester);
  const halfLabel = half === "1" ? dict.school.half1 : dict.school.half2;

  const pages = getContentForSubject(subject).filter((c) => c.semester === semester);
  // Tests and decks have no half-year in the database yet: they belong to the current one.
  const withPractice = semester === PRACTICE_SEMESTER;
  const state = useLoad(() => loadSubject(subject, withPractice), `subject:${semester}:${subject}`);
  const minis = state.data?.quizList.filter((q) => q.kind === "mini") ?? [];
  const mocks = state.data?.quizList.filter((q) => q.kind === "mock") ?? [];
  const decks = state.data?.deckList ?? [];
  const nextExam = state.data?.exams[0] ?? null;
  const [today, setToday] = useState<string | null>(null);
  const progress =
    state.data && today ? (subjectProgress(state.data.quizList, state.data.deckList, today)[0] ?? null) : null;

  const [tab, setTab] = useState<Tab>("pages");
  useEffect(() => {
    setToday(todayISO());
    const fromHash = window.location.hash.slice(1);
    if (isTab(fromHash)) setTab(fromHash);
  }, []);
  function choose(next: Tab) {
    setTab(next);
    history.replaceState(null, "", `#${next}`);
  }

  const counts: Record<Tab, number> = { pages: pages.length, mini: minis.length, mock: mocks.length, cards: decks.length };
  const labels: Record<Tab, string> = { pages: t.studyPages, mini: t.miniTests, mock: t.mockExams, cards: t.flashcards };
  const p = dict.practice;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
      <Breadcrumb
        items={[
          { label: fill(dict.school.grade, { grade }), href: gradeHref(grade) },
          { label: halfLabel, href: semesterHref(semester) },
          { label: info.label[locale] },
        ]}
      />

      <header className="enter mt-5 flex items-center gap-4 sm:gap-6">
        <SubjectBook subject={subject} size="sm" className="w-16 shrink-0 sm:w-20" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">{info.label[locale]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fill(dict.school.grade, { grade })} · {halfLabel}
          </p>
          {nextExam && (
            <Link href="/grades?tab=exams" className="group mt-2 inline-flex items-center gap-1.5 text-sm">
              <CalendarClock size={15} className="text-muted-foreground" aria-hidden />
              <span className="text-muted-foreground">{dict.home.nextExam}</span>
              <span className="font-medium">{formatDate(nextExam.exam_date, locale, { weekday: "short", day: "numeric", month: "short" })}</span>
              <span className="font-semibold text-[var(--c-amber)]">· {whenLabel(nextExam.exam_date, dict)}</span>
            </Link>
          )}
        </div>
      </header>

      {withPractice && progress && (
        <div className="enter mt-6">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{dict.subject.progress}</span>
            <span className="truncate text-xs text-muted-foreground">
              {[
                progress.tests ? fill(dict.subject.testsTaken, { a: progress.testsTaken, n: progress.tests }) : "",
                progress.avgBest !== null ? fill(dict.subject.avg, { p: `${Math.round(progress.avgBest * 100)} %` }) : "",
                progress.cards ? fill(dict.subject.cardsLearned, { a: progress.cardsLearned, n: progress.cards }) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="tabular-nums text-muted-foreground">{Math.round(progress.progress * 100)} %</span>
          </div>
          <ProgressBar value={progress.progress} className="mt-2" />
        </div>
      )}

      {/* Tabs: one quiet underline row, sticky while scrolling */}
      <div className="sticky top-14 z-30 -mx-4 mt-8 bg-background/90 px-4 backdrop-blur-xl lg:top-0">
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => choose(id)}
              className={cn(
                "relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                tab === id ? "border-[var(--c-amber)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[id]}
              <span className="rounded-md bg-secondary px-1.5 text-[11px] tabular-nums text-muted-foreground">
                {id !== "pages" && state.loading ? "·" : counts[id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="enter mt-5" role="tabpanel">
        {tab !== "pages" && state.loading ? (
          <div className="h-48 animate-pulse rounded-xl border bg-card" />
        ) : tab === "pages" ? (
          <List empty={t.emptyPages}>
            {pages.map((item) => (
              <Row
                key={item.id}
                href={`/library/${item.subject}/${item.id}`}
                icon={KIND_ICON[item.kind]}
                title={item.title}
                meta={`${dict.kind[item.kind]} · ${item.topic}`}
                lang="de"
              />
            ))}
          </List>
        ) : tab === "mini" || tab === "mock" ? (
          <List empty={tab === "mini" ? t.emptyTests : t.emptyMocks}>
            {(tab === "mini" ? minis : mocks).map((q) => (
              <Row
                key={q.id}
                href={`/practice/quiz?id=${q.id}`}
                icon={tab === "mini" ? ListChecks : Timer}
                title={q.title}
                meta={[
                  q.questionCount === 1 ? p.oneQuestion : fill(p.questions, { n: q.questionCount }),
                  q.durationMinutes ? fill(p.minutes, { n: q.durationMinutes }) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
                aside={
                  q.best === null ? (
                    <span className="text-sm text-muted-foreground">–</span>
                  ) : (
                    <span className="text-sm font-semibold tabular-nums">{Math.round(q.best * 100)} %</span>
                  )
                }
              />
            ))}
          </List>
        ) : (
          <List empty={t.emptyDecks}>
            {decks.map((d) => {
              const due = today === null ? null : dueCount(d, today);
              return (
                <Row
                  key={d.id}
                  href={`/practice/deck?id=${d.id}`}
                  icon={Layers}
                  title={d.title}
                  meta={d.cardCount === 1 ? p.oneCard : fill(p.cards, { n: d.cardCount })}
                  aside={
                    due === null ? null : due > 0 ? (
                      <span className="text-sm font-semibold tabular-nums text-[var(--c-amber)]">{fill(p.due, { n: due })}</span>
                    ) : (
                      <Check size={16} className="text-muted-foreground" aria-label={t.allDone} />
                    )
                  }
                />
              );
            })}
          </List>
        )}
      </div>
    </div>
  );
}

function whenLabel(date: string, dict: ReturnType<typeof useI18n>["dict"]) {
  const days = daysUntil(date);
  return days <= 0 ? dict.home.today : days === 1 ? dict.home.tomorrow : fill(dict.home.inDays, { n: days });
}

function List({ empty, children }: { empty: string; children: React.ReactNode[] }) {
  if (children.length === 0) {
    return <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return <ul className="divide-y overflow-hidden rounded-xl border bg-card">{children}</ul>;
}

function Row({
  href,
  icon: Icon,
  title,
  meta,
  aside,
  lang,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  meta: string;
  aside?: React.ReactNode;
  lang?: string;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-secondary/60">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" lang={lang} dir="auto">
            {title}
          </p>
          <p className="truncate text-sm text-muted-foreground" lang={lang} dir="auto">
            {meta}
          </p>
        </div>
        {aside}
        <ChevronRight
          size={16}
          className="shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        />
      </Link>
    </li>
  );
}
