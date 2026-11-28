"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-gate";
import { SubjectIcon } from "@/components/subject-icon";
import { useLoad } from "@/lib/data";
import type { SchoolExam } from "@/lib/exams";
import { formatDate, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill, type Dictionary } from "@/lib/i18n/dictionaries";
import { daysUntil, loadSchoolExams } from "@/lib/loaders";
import { subjectHref } from "@/lib/school";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export function whenLabel(date: string, dict: Dictionary) {
  const days = daysUntil(date);
  return days <= 0 ? dict.exams.today : days === 1 ? dict.exams.tomorrow : fill(dict.exams.inDays, { n: days });
}

/** The next seven days as letters, with a lit square on every exam day. */
export function WeekStrip({ exams, className }: { exams: SchoolExam[]; className?: string }) {
  const { locale } = useI18n();
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, letter: formatDate(iso, locale, { weekday: "narrow" }), exam: exams.some((e) => e.exam_date === iso) };
  });
  return (
    <ol className={cn("flex gap-1.5", className)} aria-hidden>
      {days.map((d, i) => (
        <li key={d.iso} className="flex w-6 flex-col items-center gap-1.5">
          <span className={cn("size-5 rounded-[5px] border", d.exam ? "border-transparent bg-[var(--hero-acc)]" : "border-dashed border-white/25")} />
          <span className={cn("label-mono !tracking-normal", i === 0 ? "!text-white" : "!text-white/45")}>{d.letter}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Dark card with the next exam, the week ahead and two actions: the calendar
 * and studying that subject. Loads the exam plan itself.
 */
export function NextExamCard({ onPick }: { onPick?: () => void }) {
  const { subjects } = useAuth();
  const { locale, dict } = useI18n();
  const t = dict.home2;
  const { data } = useLoad(() => loadSchoolExams(subjects), `exams-next:${subjects.join(",")}`);
  const next = data?.[0] ?? null;
  return (
    <section className="dark-card relative overflow-hidden rounded-[24px] p-5 text-white">
      <p className="label-mono !text-white/60">{t.examTile}</p>
      {!data ? (
        <div className="mt-6 h-24 animate-pulse rounded-xl bg-white/5" />
      ) : (
        <div className="mt-4">
          {next ? (
            <>
              <p className="flex items-center gap-2.5 font-display text-[1.9rem] font-semibold leading-tight tracking-tight">
                <SubjectIcon subject={next.subject} className="size-7 shrink-0 text-[var(--hero-acc)]" strokeWidth={2} />
                <span className="truncate">{SUBJECTS[next.subject].label[locale]}</span>
              </p>
              <p className="mt-1 truncate text-sm text-white/70">
                <span className="font-semibold text-[var(--hero-acc)]">{whenLabel(next.exam_date, dict)}</span>
                {" · "}
                {formatDate(next.exam_date, locale, { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </>
          ) : (
            <p className="font-display text-xl font-semibold">{t.noExam}</p>
          )}
          <WeekStrip exams={data} className="mt-5" />
        </div>
      )}
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-2.5">
        <Link href="/grades?tab=exams" onClick={onPick} className="press flex h-12 items-center gap-2 rounded-2xl border border-white/15 px-4 text-sm font-semibold hover:bg-white/10">
          <CalendarDays size={18} />
          {t.calendar}
        </Link>
        <Link
          href={next ? subjectHref(next.subject) : "/grades?tab=exams"}
          onClick={onPick}
          className="press flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--hero-acc)] px-4 text-sm font-bold text-[#0e0c0a]"
        >
          <span className="truncate">{dict.home2.study}</span>
          <ArrowRight size={17} className="shrink-0 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
}
