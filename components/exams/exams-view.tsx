"use client";

import { Clock, Printer, Sun, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { EXAM_PLAN_UPDATED, formatPeriods, sortByDate, type SchoolExam } from "@/lib/exams";
import { formatDate, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { daysUntil } from "@/lib/loaders";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** The school's exam plan (read-only): the next exam big, then upcoming and written ones. */
export function ExamsView({ exams }: { exams: SchoolExam[] }) {
  const { dict, locale } = useI18n();
  // "Today" needs the browser's date, so only after mount.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  if (today === null) return <div className="h-40 animate-pulse rounded-xl border bg-card shadow-card" aria-hidden />;

  const upcoming = sortByDate(exams.filter((e) => e.exam_date >= today));
  const written = sortByDate(exams.filter((e) => e.exam_date < today), -1);

  return (
    <div className="flex flex-col gap-8">
      <NextExam exam={upcoming[0] ?? null} />
      <div className="-mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{fill(dict.exams.planUpdated, { date: formatDate(EXAM_PLAN_UPDATED, locale, { day: "numeric", month: "long", year: "numeric" }) })}</span>
        <button type="button" onClick={() => window.print()} className="no-print hit flex items-center gap-1.5 hover:text-foreground">
          <Printer size={14} aria-hidden />
          {dict.exams.print}
        </button>
      </div>
      {[
        { heading: dict.exams.upcoming, list: upcoming },
        { heading: dict.exams.written, list: written },
      ].map(({ heading, list }) =>
        list.length === 0 ? null : (
          <section key={heading}>
            <h2 className="eyebrow mb-3">{heading}</h2>
            <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
              {list.map((exam) => (
                <ExamRow key={exam.id} exam={exam} past={exam.exam_date < today} />
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

function Meta({ exam }: { exam: SchoolExam }) {
  const { dict } = useI18n();
  const t = dict.exams;
  return (
    <>
      {exam.periods && (
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden />
          {fill(t.lessons, { p: formatPeriods(exam.periods) })}
        </span>
      )}
      {exam.classes && (
        <span className="flex items-center gap-1">
          <Users size={14} aria-hidden />
          {fill(t.onlyClasses, { c: formatPeriods(exam.classes) })}
        </span>
      )}
    </>
  );
}

function NextExam({ exam }: { exam: SchoolExam | null }) {
  const { locale, dict } = useI18n();
  const t = dict.exams;
  if (!exam) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Sun className="mx-auto mb-2 size-6" strokeWidth={2} aria-hidden />
        {t.noUpcoming}
      </div>
    );
  }
  const days = daysUntil(exam.exam_date);
  return (
    <section aria-label={t.next} className="relative overflow-hidden rounded-xl border bg-card shadow-card p-5 sm:p-6">
      <div aria-hidden className="glow-orb pointer-events-none absolute -end-20 -top-24 size-72" />
      <p className="eyebrow relative">{t.next}</p>
      <h2 className="relative mt-2 font-display text-2xl font-semibold sm:text-3xl">
        <SubjectIcon subject={exam.subject} className="-mt-1 me-2 inline size-[0.9em] align-middle text-[var(--c-amber)]" />
        {SUBJECTS[exam.subject].label[locale]}
        {exam.title && <span className="font-normal text-muted-foreground"> · {exam.title}</span>}
      </h2>
      <p className="relative mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{formatDate(exam.exam_date, locale, { weekday: "long", day: "numeric", month: "long" })}</span>
        <Meta exam={exam} />
      </p>
      <p className="relative mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--c-amber)]">
        {days <= 0 ? t.today : days === 1 ? t.tomorrow : fill(t.inDays, { n: days })}
      </p>
    </section>
  );
}

function ExamRow({ exam, past }: { exam: SchoolExam; past: boolean }) {
  const { locale } = useI18n();
  return (
    <li className={cn("flex items-center gap-4 px-4 py-3.5", past && "opacity-60")}>
      <div className="w-12 shrink-0 text-center">
        <div className="font-display text-xl leading-none tabular-nums">
          {formatDate(exam.exam_date, locale, { day: "numeric" })}
        </div>
        <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {formatDate(exam.exam_date, locale, { month: "short" })}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          <SubjectIcon subject={exam.subject} className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {SUBJECTS[exam.subject].label[locale]}
            {exam.title && <span className="font-normal text-muted-foreground"> · {exam.title}</span>}
          </span>
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{formatDate(exam.exam_date, locale, { weekday: "long" })}</span>
          <Meta exam={exam} />
        </p>
      </div>
    </li>
  );
}
