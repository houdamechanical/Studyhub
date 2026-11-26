"use client";

import {
  CalendarClock,
  FileText,
  Gamepad2,
  Layers,
  ListChecks,
  MousePointerClick,
  Plus,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackPill } from "@/components/page-hero";
import { getContentForSubject, type ContentItem, type ContentKind } from "@/lib/content";
import { useLoad } from "@/lib/data";
import type { Exam } from "@/lib/exams";
import { formatDate, formatTime, todayISO } from "@/lib/format";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill, formatPageCount } from "@/lib/i18n/dictionaries";
import {
  daysUntil,
  dueCount,
  loadPractice,
  loadUpcomingExams,
  type DeckSummary,
  type QuizSummary,
} from "@/lib/loaders";
import { PRACTICE_SEMESTER, semesterHref, splitSemester } from "@/lib/school";
import { SUBJECTS, subjectGradient, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ContentKind, LucideIcon> = {
  notes: FileText,
  quiz: Gamepad2,
  interactive: MousePointerClick,
};

async function loadSubject(subject: SubjectId, withPractice: boolean) {
  const [practice, exams] = await Promise.all([
    withPractice ? loadPractice(subject) : Promise.resolve({ quizList: [], deckList: [] }),
    loadUpcomingExams(subject),
  ]);
  return { ...practice, exams };
}

/**
 * /grade/11/1/bio – everything for one subject in one half-year. Every subject
 * uses exactly this layout; empty sections say so instead of disappearing.
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
  const data = state.data;
  const minis = data?.quizList.filter((q) => q.kind === "mini") ?? [];
  const mocks = data?.quizList.filter((q) => q.kind === "mock") ?? [];
  const decks = data?.deckList ?? [];
  const exams = data?.exams ?? [];

  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  const totalDue = today ? decks.reduce((s, d) => s + dueCount(d, today), 0) : 0;

  const sections = [
    { id: "pages", label: t.studyPages, icon: FileText, count: pages.length },
    { id: "mini", label: t.miniTests, icon: ListChecks, count: minis.length },
    { id: "mock", label: t.mockExams, icon: Timer, count: mocks.length },
    { id: "cards", label: t.flashcards, icon: Layers, count: decks.length },
    { id: "exams", label: t.exams, icon: CalendarClock, count: exams.length },
  ];

  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:pt-8"
      style={{ "--subject": info.color, "--subject-2": info.gradient[1] } as React.CSSProperties}
    >
      <BackPill href={semesterHref(semester)} label={dict.nav.subjects} />

      {/* Hero */}
      <section
        className="relative isolate mt-4 overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl sm:p-10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500"
        style={{ backgroundImage: subjectGradient(subject) }}
      >
        <span className="tile-dots absolute inset-0 -z-10 opacity-60" aria-hidden />
        <span
          className="pointer-events-none absolute -bottom-10 -end-6 -z-10 select-none text-[11rem] leading-none opacity-25 motion-safe:animate-float sm:-bottom-14 sm:text-[16rem]"
          aria-hidden
        >
          {info.emoji}
        </span>
        <span
          className="absolute -start-20 -top-24 -z-10 size-72 rounded-full bg-white/20 blur-3xl"
          aria-hidden
        />
        <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
          {fill(dict.school.grade, { grade })} · {halfLabel}
        </p>
        <h1 className="mt-4 flex items-center gap-3 font-display text-5xl font-extrabold leading-none tracking-tight drop-shadow-sm sm:text-7xl">
          <span className="glass flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl sm:size-20 sm:text-5xl">
            {info.emoji}
          </span>
          {info.label[locale]}
        </h1>
        <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
          <HeroStat>{formatPageCount(pages.length, dict)}</HeroStat>
          {withPractice && data && (
            <>
              <HeroStat>
                {minis.length + mocks.length === 1
                  ? dict.school.oneTest
                  : fill(dict.school.tests, { n: minis.length + mocks.length })}
              </HeroStat>
              {totalDue > 0 && <HeroStat>🃏 {fill(dict.practice.due, { n: totalDue })}</HeroStat>}
            </>
          )}
          {exams[0] && (
            <HeroStat>
              📅 {dict.home.nextExam}: {whenLabel(exams[0].exam_date, dict)}
            </HeroStat>
          )}
        </div>
      </section>

      {/* Jump to a section */}
      <nav className="sticky top-16 z-30 -mx-4 mt-4 overflow-x-auto bg-background/80 px-4 py-2 backdrop-blur-xl [scrollbar-width:none]">
        <ul className="flex w-max gap-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-3.5 py-2 text-sm font-semibold shadow-sm transition-colors hover:border-[var(--subject)]"
              >
                <s.icon size={15} className="text-[var(--subject)]" />
                {s.label}
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                  {state.loading && s.id !== "pages" ? "·" : s.count}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 flex flex-col gap-12">
        <Section id="pages" icon={FileText} title={t.studyPages} count={pages.length} empty={t.emptyPages} emoji="📄">
          {pages.map((item, i) => (
            <StudyPageCard key={item.id} item={item} index={i} />
          ))}
        </Section>

        <Section
          id="mini"
          icon={ListChecks}
          title={t.miniTests}
          count={minis.length}
          empty={t.emptyTests}
          emoji="✅"
          loading={state.loading}
        >
          {minis.map((q, i) => (
            <QuizCard key={q.id} quiz={q} index={i} />
          ))}
        </Section>

        <Section
          id="mock"
          icon={Timer}
          title={t.mockExams}
          count={mocks.length}
          empty={t.emptyMocks}
          emoji="⏱️"
          loading={state.loading}
        >
          {mocks.map((q, i) => (
            <QuizCard key={q.id} quiz={q} index={i} />
          ))}
        </Section>

        <Section
          id="cards"
          icon={Layers}
          title={t.flashcards}
          count={decks.length}
          empty={t.emptyDecks}
          emoji="🃏"
          loading={state.loading}
        >
          {decks.map((d, i) => (
            <DeckCard key={d.id} deck={d} today={today} index={i} />
          ))}
        </Section>

        <Section
          id="exams"
          icon={CalendarClock}
          title={t.exams}
          count={exams.length}
          empty={t.emptyExams}
          emoji="📅"
          loading={state.loading}
          action={
            <Link
              href="/grades?tab=exams"
              className="flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--subject)_14%,transparent)] px-3 py-1.5 text-sm font-bold text-[var(--subject)] transition-colors hover:bg-[color-mix(in_srgb,var(--subject)_22%,transparent)]"
            >
              <Plus size={15} /> {t.addExam}
            </Link>
          }
        >
          {exams.map((e, i) => (
            <ExamCard key={e.id} exam={e} index={i} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function HeroStat({ children }: { children: React.ReactNode }) {
  return <span className="glass rounded-full px-3 py-1.5">{children}</span>;
}

function whenLabel(date: string, dict: ReturnType<typeof useI18n>["dict"]) {
  const days = daysUntil(date);
  return days <= 0 ? dict.home.today : days === 1 ? dict.home.tomorrow : fill(dict.home.inDays, { n: days });
}

function Section({
  id,
  icon: Icon,
  title,
  count,
  empty,
  emoji,
  loading = false,
  action,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  count: number;
  empty: string;
  emoji: string;
  loading?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--subject)_15%,transparent)] text-[var(--subject)]">
          <Icon size={20} strokeWidth={2.5} />
        </span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {!loading && count > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-bold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
        {action && <div className="ms-auto">{action}</div>}
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-[color-mix(in_srgb,var(--subject)_30%,transparent)] bg-[color-mix(in_srgb,var(--subject)_5%,transparent)] p-5">
          <span className="text-3xl grayscale-[30%]" aria-hidden>
            {emoji}
          </span>
          <p className="font-medium text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
      )}
    </section>
  );
}

/** Shared card shell: white card, subject-coloured hover glow, staggered entrance. */
function CardLink({
  href,
  index,
  children,
  className,
}: {
  href: string;
  index: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both motion-safe:duration-500"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <Link
        href={href}
        className={cn(
          "tile group flex h-full gap-4 rounded-3xl border bg-card p-4 hover:border-[color-mix(in_srgb,var(--subject)_45%,transparent)] hover:shadow-[0_20px_40px_-20px_var(--subject)] sm:p-5",
          className,
        )}
      >
        {children}
      </Link>
    </li>
  );
}

function StudyPageCard({ item, index }: { item: ContentItem; index: number }) {
  const { dict } = useI18n();
  const Icon = KIND_ICON[item.kind];
  return (
    <CardLink href={`/library/${item.subject}/${item.id}`} index={index} className="flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ backgroundImage: subjectGradient(item.subject) }}
        >
          <Icon size={20} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--subject)]">{dict.kind[item.kind]}</p>
          <p className="truncate text-sm text-muted-foreground" lang="de" dir="auto">
            {item.topic}
          </p>
        </div>
      </div>
      <p className="font-display text-lg font-bold leading-snug" lang="de" dir="auto">
        {item.title}
      </p>
      {item.tags.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1" lang="de">
          {item.tags.slice(0, 4).map((tag) => (
            <li key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {tag}
            </li>
          ))}
          {item.tags.length > 4 && (
            <li className="px-1 text-[11px] font-medium text-muted-foreground">+{item.tags.length - 4}</li>
          )}
        </ul>
      )}
    </CardLink>
  );
}

function QuizCard({ quiz, index }: { quiz: QuizSummary; index: number }) {
  const { dict } = useI18n();
  const t = dict.practice;
  return (
    <CardLink href={`/practice/quiz?id=${quiz.id}`} index={index} className="items-center">
      <ProgressRing value={quiz.best} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold leading-snug sm:text-lg" dir="auto">
          {quiz.title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {[
            quiz.questionCount === 1 ? t.oneQuestion : fill(t.questions, { n: quiz.questionCount }),
            quiz.durationMinutes ? fill(t.minutes, { n: quiz.durationMinutes }) : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          {quiz.best === null ? dict.subject.notTaken : fill(t.attempts, { n: quiz.attempts })}
        </p>
      </div>
    </CardLink>
  );
}

/** Circle showing your best result (or a dashed empty circle). */
function ProgressRing({ value }: { value: number | null }) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.round(value * 100);
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
          strokeDasharray={value === null ? "3 5" : undefined}
        />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="var(--subject)"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        )}
      </svg>
      <span className="absolute font-display text-sm font-extrabold tabular-nums">
        {value === null ? <span className="text-lg text-muted-foreground">?</span> : `${pct}%`}
      </span>
    </span>
  );
}

function DeckCard({ deck, today, index }: { deck: DeckSummary; today: string | null; index: number }) {
  const { dict } = useI18n();
  const t = dict.practice;
  const due = today === null ? null : dueCount(deck, today);
  return (
    <CardLink href={`/practice/deck?id=${deck.id}`} index={index} className="items-center">
      {/* little stack of cards */}
      <span className="relative h-14 w-12 shrink-0" aria-hidden>
        <span className="absolute inset-0 rotate-[-10deg] rounded-xl bg-[color-mix(in_srgb,var(--subject)_25%,transparent)] transition-transform group-hover:rotate-[-16deg]" />
        <span className="absolute inset-0 rotate-[6deg] rounded-xl bg-[color-mix(in_srgb,var(--subject-2)_40%,transparent)] transition-transform group-hover:rotate-[12deg]" />
        <span
          className="absolute inset-0 flex items-center justify-center rounded-xl text-white shadow-md"
          style={{ backgroundImage: "linear-gradient(135deg, var(--subject), var(--subject-2))" }}
        >
          <Layers size={20} />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold leading-snug sm:text-lg" dir="auto">
          {deck.title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {deck.cardCount === 1 ? t.oneCard : fill(t.cards, { n: deck.cardCount })}
        </p>
        {due !== null && (
          <p className="mt-1.5">
            {due > 0 ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--subject)_16%,transparent)] px-2.5 py-0.5 text-xs font-bold text-[var(--subject)]">
                {fill(t.due, { n: due })}
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">{dict.subject.allDone}</span>
            )}
          </p>
        )}
      </div>
    </CardLink>
  );
}

function ExamCard({ exam, index }: { exam: Exam; index: number }) {
  const { locale, dict } = useI18n();
  const days = daysUntil(exam.exam_date);
  return (
    <CardLink href="/grades?tab=exams" index={index} className="items-center">
      <span
        className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-md"
        style={{ backgroundImage: subjectGradient(exam.subject) }}
      >
        <span className="font-display text-xl font-extrabold leading-none">
          {formatDate(exam.exam_date, locale, { day: "numeric" })}
        </span>
        <span className="text-[10px] font-bold uppercase">{formatDate(exam.exam_date, locale, { month: "short" })}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-bold sm:text-lg" dir="auto">
          {exam.title || dict.examType[exam.type]}
        </p>
        <p className="text-sm text-muted-foreground">
          {[dict.examType[exam.type], formatTime(exam.start_time), exam.room].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-sm font-bold",
          days <= 3 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-muted",
        )}
      >
        {whenLabel(exam.exam_date, dict)}
      </span>
    </CardLink>
  );
}
