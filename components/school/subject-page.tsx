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
import { MeasuredIndicator } from "@/components/sliding-indicator";
import { ProgressBar } from "@/components/progress-bar";
import { SubjectIcon } from "@/components/subject-icon";
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

      <header className="enter mt-6">
        <h1 className="flex items-center gap-3 font-display text-3xl font-semibold sm:text-4xl">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-secondary sm:size-12">
            <SubjectIcon subject={subject} className="size-5 sm:size-6" strokeWidth={2} />
          </span>
          {info.label[locale]}
        </h1>
        {nextExam && (
          <Link
            href="/grades?tab=exams"
            className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <CalendarClock size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground">{dict.home.nextExam}:</span>
            <span className="font-medium">{formatDate(nextExam.exam_date, locale, { day: "numeric", month: "short" })}</span>
            <span className="font-semibold text-primary">{whenLabel(nextExam.exam_date, dict)}</span>
          </Link>
        )}
        {withPractice && progress && (
          <div className="mt-6 rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{dict.subject.progress}</p>
              <p className="text-sm tabular-nums text-muted-foreground">{Math.round(progress.progress * 100)} %</p>
            </div>
            <ProgressBar value={progress.progress} className="mt-2.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              {[
                progress.tests ? fill(dict.subject.testsTaken, { a: progress.testsTaken, n: progress.tests }) : "",
                progress.avgBest !== null ? fill(dict.subject.avg, { p: `${Math.round(progress.avgBest * 100)} %` }) : "",
                progress.cards ? fill(dict.subject.cardsLearned, { a: progress.cardsLearned, n: progress.cards }) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-30 -mx-4 mt-8 lg:top-0 bg-background/85 px-4 py-2 backdrop-blur-xl">
        <div className="overflow-x-auto [scrollbar-width:none]">
          <div role="tablist" className="relative flex w-max gap-1 rounded-full border bg-card p-1">
            <MeasuredIndicator activeKey={tab} className="rounded-full bg-[var(--c-pill)]" />
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                data-key={id}
                aria-selected={tab === id}
                onClick={() => choose(id)}
                className={cn(
                  "press relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
                  tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[id]}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {id !== "pages" && state.loading ? "·" : counts[id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div key={tab} className="enter mt-4" role="tabpanel">
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
                      <span className="text-sm font-semibold tabular-nums text-primary">{fill(p.due, { n: due })}</span>
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
      <Link href={href} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary sm:px-5">
        <Icon size={18} className="shrink-0 text-muted-foreground" strokeWidth={2} />
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
