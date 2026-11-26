"use client";

import { SubjectIcon } from "@/components/subject-icon";
import { CalendarClock, ChartNoAxesColumn, GraduationCap, Layers, Plus, Sparkles, Sun, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { BigTile, TileBadge } from "@/components/big-tile";
import { useLoad } from "@/lib/data";
import { formatDate, intlLocale, todayISO } from "@/lib/format";
import { CURRENT_SEMESTER, formatScore, semesterScore } from "@/lib/grades";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { daysUntil, dueCount, loadGrades, loadPractice, loadUpcomingExams } from "@/lib/loaders";
import { getDisplayScale } from "@/lib/mutations/grades";
import { CURRENT, gradeHref, OPEN_GRADES, SCHOOL_GRADES } from "@/lib/school";
import { meshGradient, SUBJECTS, subjectGradient } from "@/lib/subjects";

const GRADE_BACKGROUND: Record<string, string> = {
  "11": "linear-gradient(120deg, #6366f1, #a855f7 40%, #ec4899 70%, #6366f1)",
  "12": meshGradient("#64748b", "#334155"),
};

async function loadHome() {
  const [exams, practice, grades] = await Promise.all([
    loadUpcomingExams(),
    loadPractice(),
    loadGrades(CURRENT_SEMESTER),
  ]);
  return { exams, decks: practice.deckList, grades, scale: getDisplayScale() };
}

export default function HomePage() {
  const { nickname } = useAuth();
  const { locale, dict } = useI18n();
  const t = dict.home;
  useTitle(dict.nav.home);
  const state = useLoad(loadHome, "home");
  const data = state.data;
  // Dates depend on the browser's clock; only use them after mounting.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);

  const avg = data ? semesterScore(data.grades) : null;
  const halfLabel = CURRENT.half === "1" ? dict.school.half1 : dict.school.half2;
  const dueDecks = data && today ? data.decks.map((d) => ({ d, n: dueCount(d, today) })).filter((x) => x.n > 0) : [];
  const totalDue = dueDecks.reduce((s, x) => s + x.n, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:pt-12">
      {/* Greeting */}
      <section className="enter">
        <p className="flex items-center gap-2 text-base font-semibold text-muted-foreground sm:text-lg">
          <Sparkles className="size-5 text-fuchsia-500 motion-safe:animate-float" aria-hidden />
          {t.welcome}
        </p>
        <h1 className="mt-1 break-words pb-1 font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl">
          <bdi className="text-brand animate-gradient-pan">{nickname || "…"}</bdi>
          <span className="inline-block origin-[70%_70%] motion-safe:animate-float" aria-hidden>
            {" "}
            👋
          </span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground sm:text-xl">{t.subtitle}</p>
      </section>

      {/* The four choices */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5">
        {SCHOOL_GRADES.map((g, i) => {
          const open = OPEN_GRADES.includes(g);
          return (
            <BigTile
              key={g}
              href={open ? gradeHref(g) : undefined}
              locked={!open}
              background={GRADE_BACKGROUND[g]}
              animate={open}
              icon={GraduationCap}
              title={fill(t.grade, { grade: g })}
              subtitle={open ? (g === CURRENT.grade ? fill(t.nowIn, { half: halfLabel }) : null) : t.comingSoon}
              badge={open && g === CURRENT.grade ? <TileBadge dot>{dict.school.now}</TileBadge> : undefined}
              delay={80 + i * 90}
            />
          );
        })}
        <BigTile
          href="/grades"
          background={meshGradient("#10b981", "#06b6d4")}
          icon={ChartNoAxesColumn}
          title={t.gradesExams}
          subtitle={avg !== null && data ? fill(t.gradesHint, { avg: formatScore(avg, data.scale, intlLocale(locale)) }) : t.gradesEmpty}
          delay={260}
        />
        <BigTile
          href="/compare"
          background={meshGradient("#f59e0b", "#ef4444")}
          icon={Trophy}
          title={t.leaderboard}
          subtitle={t.leaderboardHint}
          delay={350}
        />
      </div>

      {/* Today: next exam + flashcards to review */}
      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 enter [animation-delay:320ms]">
        <NextExamCard exams={data?.exams ?? null} today={today} />
        {totalDue > 0 && (
          <Link
            href={`/practice/deck?id=${dueDecks[0].d.id}`}
            className="tile group flex items-center gap-4 rounded-3xl border bg-card p-4 sm:p-5"
          >
            <span className="grain relative isolate flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand text-white shadow-md shadow-fuchsia-500/25">
              <Layers size={24} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-tight">
                {totalDue === 1 ? t.oneDueCard : fill(t.dueCards, { n: totalDue })}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                <SubjectIcon subject={dueDecks[0].d.subject} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />{dueDecks[0].d.title}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function NextExamCard({ exams, today }: { exams: Awaited<ReturnType<typeof loadUpcomingExams>> | null; today: string | null }) {
  const { locale, dict } = useI18n();
  const t = dict.home;

  if (exams === null || today === null) {
    return <div className="h-[88px] animate-pulse rounded-3xl bg-muted sm:h-[96px]" />;
  }
  const exam = exams[0];
  if (!exam) {
    return (
      <div className="flex items-center gap-4 rounded-3xl border border-dashed bg-card/60 p-4 sm:p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-500">
          <Sun size={24} strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t.noExam}</p>
          <Link
            href="/grades?tab=exams"
            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <Plus size={14} /> {t.addExam}
          </Link>
        </div>
      </div>
    );
  }
  const days = daysUntil(exam.exam_date);
  const when = days <= 0 ? t.today : days === 1 ? t.tomorrow : fill(t.inDays, { n: days });
  const subject = SUBJECTS[exam.subject];
  return (
    <Link href="/grades?tab=exams" className="tile group flex items-center gap-4 rounded-3xl border bg-card p-4 sm:p-5">
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
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <CalendarClock size={13} /> {t.nextExam}
        </p>
        <p className="truncate font-display text-lg font-bold leading-tight">
          <SubjectIcon subject={exam.subject} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />{exam.title || subject.label[locale]}
        </p>
      </div>
      <span
        className={
          days <= 3
            ? "shrink-0 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-600 dark:text-rose-400"
            : "shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-bold"
        }
      >
        {when}
      </span>
    </Link>
  );
}
