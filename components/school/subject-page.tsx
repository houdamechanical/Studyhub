"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Gamepad2,
  Layers,
  ListChecks,
  MousePointerClick,
  PencilLine,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { SubjectBook } from "@/components/subject-book";
import { subjectProgress } from "@/lib/progress";
import { getContentForSubject, type ContentKind } from "@/lib/content";
import { useLoad } from "@/lib/data";
import { formatDate, todayISO } from "@/lib/format";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import {
  daysUntil,
  dueCount,
  loadPractice,
  loadSchoolExams,
} from "@/lib/loaders";
import { PRACTICE_SEMESTER, semesterHref, splitSemester } from "@/lib/school";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ContentKind, LucideIcon> = {
  notes: FileText,
  quiz: Gamepad2,
  interactive: MousePointerClick,
  exercises: PencilLine,
  exam: Timer,
};

const TABS = ["pages", "mini", "mock", "cards"] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string): v is Tab => (TABS as readonly string[]).includes(v);

async function loadSubject(subject: SubjectId, withPractice: boolean) {
  const [practice, exams] = await Promise.all([
    withPractice
      ? loadPractice(subject)
      : Promise.resolve({ quizList: [], deckList: [] }),
    loadSchoolExams([subject], { subject }),
  ]);
  return { ...practice, exams };
}

/**
 * /grade/11/1/bio – one subject in one half-year. Every subject has exactly
 * this layout: a short header, then tabs for study pages, mini tests, mock
 * exams and flashcards (the tab is kept in the URL hash, e.g. #mini).
 */
export function SubjectPage({
  semester,
  subject,
}: {
  semester: string;
  subject: SubjectId;
}) {
  const { locale, dict } = useI18n();
  const t = dict.subject;
  const info = SUBJECTS[subject];
  useTitle(info.label[locale]);
  const { grade, half } = splitSemester(semester);
  const halfLabel = half === "1" ? dict.school.half1 : dict.school.half2;

  const all = getContentForSubject(subject).filter((c) => c.semester === semester);
  // Practice exam pages go under "Probeklausuren", everything else under "Lernseiten".
  const pages = all.filter((c) => c.kind !== "exam");
  const examPages = all.filter((c) => c.kind === "exam");
  // Tests and decks have no half-year in the database yet: they belong to the current one.
  const withPractice = semester === PRACTICE_SEMESTER;
  const state = useLoad(
    () => loadSubject(subject, withPractice),
    `subject:${semester}:${subject}`,
  );
  const minis = state.data?.quizList.filter((q) => q.kind === "mini") ?? [];
  const mocks = state.data?.quizList.filter((q) => q.kind === "mock") ?? [];
  const decks = state.data?.deckList ?? [];
  const nextExam = state.data?.exams[0] ?? null;
  const [today, setToday] = useState<string | null>(null);
  const progress =
    state.data && today
      ? (subjectProgress(state.data.quizList, state.data.deckList, today)[0] ??
        null)
      : null;

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

  const counts: Record<Tab, number> = {
    pages: pages.length,
    mini: minis.length,
    mock: mocks.length + examPages.length,
    cards: decks.length,
  };
  const labels: Record<Tab, string> = {
    pages: t.studyPages,
    mini: t.miniTests,
    mock: t.mockExams,
    cards: t.flashcards,
  };
  const p = dict.practice;

  const topics = [...new Set(pages.map((p) => p.topic))];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:pt-8">
      <Link href={semesterHref(semester)} className="press inline-flex items-center gap-2.5 text-muted-foreground hover:text-foreground">
        <span className="tile flex size-10 items-center justify-center rounded-xl">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </span>
        <span className="label-mono !text-current">{dict.school.subjects}</span>
      </Link>

      <header className="enter mt-6 flex items-center gap-5">
        <SubjectBook subject={subject} label={info.label[locale]} size="sm" className="w-20 shrink-0 sm:w-24" />
        <div className="min-w-0 flex-1">
          <p className="label-mono">
            {fill(dict.school.grade, { grade })} · {halfLabel}
          </p>
          <h1 className="mt-1 truncate font-display text-4xl font-semibold tracking-tight sm:text-5xl">{info.label[locale]}</h1>
        </div>
      </header>

      {(nextExam || (withPractice && progress)) && (
        <div className="enter mt-6 grid grid-cols-2 gap-2.5">
          {nextExam ? (
            <Link href="/grades?tab=exams" className="tile press flex flex-col rounded-2xl p-4">
              <span className="label-mono max-md:!tracking-[0.08em]">{dict.home2.examTile}</span>
              <span className="mt-3 font-display text-lg font-semibold leading-tight text-[var(--c-amber)]">{whenLabel(nextExam.exam_date, dict)}</span>
              <span className="truncate text-sm text-muted-foreground">
                {formatDate(nextExam.exam_date, locale, { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {withPractice && progress ? (
            <div className="tile flex flex-col rounded-2xl p-4">
              <span className="label-mono">{dict.subject.progress}</span>
              <span className="mt-3 font-display text-lg font-semibold tabular-nums leading-tight">{Math.round(progress.progress * 100)} %</span>
              <ProgressBar value={progress.progress} className="mt-2" />
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Segmented tabs, sticky while scrolling */}
      <div className="sticky top-14 z-30 -mx-4 mt-7 bg-background/90 px-4 py-2.5 backdrop-blur-xl md:top-[5.5rem]">
        <div role="tablist" className="tile grid grid-cols-2 gap-1 rounded-2xl p-1 sm:flex">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => choose(id)}
              className={cn(
                "press flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                tab === id ? "bg-foreground text-background shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[id]}
              <span className={cn("text-xs tabular-nums", tab === id ? "opacity-60" : "opacity-70")}>{id !== "pages" && state.loading ? "·" : counts[id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="enter mt-4" role="tabpanel">
        {tab !== "pages" && state.loading ? (
          <div className="tile h-40 animate-pulse rounded-2xl" />
        ) : tab === "pages" ? (
          pages.length === 0 ? (
            <Empty text={t.emptyPages} />
          ) : (
            // One group per topic, in the order the topics first appear.
            <div className="flex flex-col gap-7">
              {topics.map((topic) => {
                const inFolder = pages.filter((p) => p.topic === topic);
                return (
                  <section key={topic}>
                    <h2 className="label-mono mb-3 flex items-center justify-between gap-3" lang="de">
                      <span className="truncate">{topic}</span>
                      <span className="tabular-nums">{String(inFolder.length).padStart(2, "0")}</span>
                    </h2>
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                      {inFolder.map((item) => (
                        <Tile key={item.id} href={`/library/${item.subject}/${item.id}`} icon={KIND_ICON[item.kind]} eyebrow={dict.kind[item.kind]} title={item.title} lang="de" />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )
        ) : tab === "mini" || tab === "mock" ? (
          (tab === "mini" ? minis.length : mocks.length + examPages.length) === 0 ? (
            <Empty text={tab === "mini" ? t.emptyTests : t.emptyMocks} />
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {tab === "mock" &&
                examPages.map((item) => (
                  <Tile key={item.id} href={`/library/${item.subject}/${item.id}`} icon={KIND_ICON[item.kind]} eyebrow={dict.kind[item.kind]} title={item.title} lang="de" />
                ))}
              {(tab === "mini" ? minis : mocks).map((q) => (
                <li key={q.id}>
                  <Link href={`/practice/quiz?id=${q.id}`} className="tile press group flex h-full flex-col rounded-2xl p-4 sm:p-5">
                    <span className="label-mono flex items-center gap-2">
                      {tab === "mini" ? <ListChecks size={14} aria-hidden /> : <Timer size={14} aria-hidden />}
                      {[q.questionCount === 1 ? p.oneQuestion : fill(p.questions, { n: q.questionCount }), q.durationMinutes ? `${q.durationMinutes}′` : ""].filter(Boolean).join(" · ")}
                    </span>
                    <span className="mt-3 font-display text-xl font-semibold leading-tight break-words" lang="de" dir="auto">
                      {q.title}
                    </span>
                    <span className="mt-auto flex items-center gap-3 pt-5">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--c-border)]">
                        <span className="block h-full rounded-full bg-[var(--c-amber)]" style={{ width: `${Math.round((q.best ?? 0) * 100)}%` }} />
                      </span>
                      <span className="w-11 text-end text-sm font-semibold tabular-nums">{q.best === null ? "–" : `${Math.round(q.best * 100)}%`}</span>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : decks.length === 0 ? (
          <Empty text={t.emptyDecks} />
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {decks.map((d) => {
              const due = today === null ? null : dueCount(d, today);
              return (
                <Tile
                  key={d.id}
                  href={`/practice/deck?id=${d.id}`}
                  icon={Layers}
                  eyebrow={d.cardCount === 1 ? p.oneCard : fill(p.cards, { n: d.cardCount })}
                  title={d.title}
                  aside={
                    due === null ? null : due > 0 ? (
                      <span className="text-sm font-semibold tabular-nums text-[var(--c-amber)]">{fill(p.due, { n: due })}</span>
                    ) : (
                      <Check size={16} className="text-[var(--c-sage)]" aria-label={t.allDone} />
                    )
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function whenLabel(date: string, dict: ReturnType<typeof useI18n>["dict"]) {
  const days = daysUntil(date);
  return days <= 0 ? dict.home.today : days === 1 ? dict.home.tomorrow : fill(dict.home.inDays, { n: days });
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

function Tile({
  href,
  icon: Icon,
  eyebrow,
  title,
  aside,
  lang,
}: {
  href: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  lang?: string;
}) {
  return (
    <li>
      <Link href={href} className="tile press group flex h-full items-center gap-3.5 rounded-2xl p-3.5 pe-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground">
          <Icon size={19} strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="label-mono block truncate !text-[0.62rem]">{eyebrow}</span>
          <span className="mt-0.5 line-clamp-2 font-semibold leading-snug" lang={lang} dir="auto">
            {title}
          </span>
        </span>
        {aside}
        <ChevronRight size={16} className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </Link>
    </li>
  );
}
