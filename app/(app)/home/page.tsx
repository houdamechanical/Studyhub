"use client";

import { ArrowRight, ChevronRight, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { CommunityAvatar } from "@/components/communities/avatar";
import { CalendarDialog, MiniCalendar } from "@/components/exams/exam-calendar";
import { SubjectIcon } from "@/components/subject-icon";
import { loadMyCommunities, type Community } from "@/lib/communities";
import { useLoad } from "@/lib/data";
import { formatPeriods, type SchoolExam } from "@/lib/exams";
import { formatDate, intlLocale, todayISO } from "@/lib/format";
import { formatPoints, loadGradeBook, ncFromResults, subjectResults } from "@/lib/gradebook";
import { CURRENT_SEMESTER, formatNC } from "@/lib/grades";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill, formatSemester, type Dictionary } from "@/lib/i18n/dictionaries";
import { daysUntil } from "@/lib/loaders";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

async function loadHome(subjects: SubjectId[]) {
  const [book, communities] = await Promise.all([
    loadGradeBook(subjects, CURRENT_SEMESTER),
    loadMyCommunities().then((r) => r.list),
  ]);
  const exams = book.exams;
  const nc = ncFromResults(subjectResults(subjects, exams, book.examGrades, book.oral));
  const today = todayISO();
  return { exams, next: exams.find((e) => e.exam_date >= today) ?? null, nc, communities };
}

/** Home: what's next. The next exam first, then your NC, a small exam calendar and your communities. */
export default function HomePage() {
  const { subjects } = useAuth();
  const { dict } = useI18n();
  useTitle(dict.nav.home);
  const { data } = useLoad(() => loadHome(subjects), `home:${subjects.join(",")}`);
  const [calendar, setCalendar] = useState(false);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-6 sm:pt-10">
      {!data ? (
        <HomeSkeleton />
      ) : (
        <div className="flex flex-col gap-4">
          <NextExam exam={data.next} />
          <div className="grid gap-4 sm:grid-cols-2">
            <NcCard nc={data.nc} />
            <MiniCalendar exams={data.exams} onOpen={() => setCalendar(true)} />
          </div>
          <CommunitiesCard list={data.communities} />
        </div>
      )}
      {calendar && data && <CalendarDialog exams={data.exams} onClose={() => setCalendar(false)} />}
    </div>
  );
}

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("enter rounded-xl border bg-card", className)}>
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="text-[13px] font-medium text-muted-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hit flex items-center gap-0.5 text-[13px] text-muted-foreground hover:text-foreground">
      {children}
      <ChevronRight size={14} className="rtl:rotate-180" />
    </Link>
  );
}

function when(date: string, dict: Dictionary) {
  const days = daysUntil(date);
  return days <= 0 ? dict.exams.today : days === 1 ? dict.exams.tomorrow : fill(dict.exams.inDays, { n: days });
}

function NextExam({ exam }: { exam: SchoolExam | null }) {
  const { locale, dict } = useI18n();
  if (!exam) {
    return (
      <Panel title={dict.home.nextExam}>
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{dict.home.noExamsLeft}</p>
      </Panel>
    );
  }
  const days = daysUntil(exam.exam_date);
  return (
    <Link
      href="/grades?tab=exams"
      className="enter group relative block overflow-hidden rounded-xl border bg-card p-5 transition-colors hover:border-[var(--c-border-strong)] sm:p-6"
    >
      {/* A whisper of the accent, top right */}
      <div aria-hidden className="pointer-events-none absolute -end-24 -top-28 size-72 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--c-amber)_14%,transparent),transparent)]" />
      <p className="relative flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
        <span className="size-1.5 rounded-full bg-[var(--c-gold)]" aria-hidden />
        {dict.home.nextExam}
      </p>
      <div className="relative mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold sm:text-4xl">
            <SubjectIcon subject={exam.subject} className="size-7 shrink-0 text-[var(--c-amber)]" strokeWidth={2} />
            <span className="truncate">{SUBJECTS[exam.subject].label[locale]}</span>
            {exam.title && <span className="truncate text-xl font-normal text-muted-foreground">· {exam.title}</span>}
          </h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatDate(exam.exam_date, locale, { weekday: "long", day: "numeric", month: "long" })}</span>
            {exam.periods && (
              <span className="flex items-center gap-1">
                <Clock size={14} aria-hidden />
                {fill(dict.exams.lessons, { p: formatPeriods(exam.periods) })}
              </span>
            )}
            {exam.classes && <span>{fill(dict.exams.onlyClasses, { c: formatPeriods(exam.classes) })}</span>}
          </p>
        </div>
        <p className={cn("font-display text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl", days <= 2 ? "text-[var(--c-gold)]" : "text-[var(--c-amber)]")}>
          {when(exam.exam_date, dict)}
        </p>
      </div>
      <span className="relative mt-4 flex items-center gap-1 text-[13px] text-muted-foreground group-hover:text-foreground">
        {dict.home.allExams}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
      </span>
    </Link>
  );
}

function NcCard({ nc }: { nc: ReturnType<typeof ncFromResults> }) {
  const { locale, dict } = useI18n();
  const nf = intlLocale(locale);
  const t = dict.home;
  return (
    <Panel title={`${t.ncTitle} · ${formatSemester(CURRENT_SEMESTER, dict)}`} action={<PanelLink href="/grades">{t.allGrades}</PanelLink>}>
      <div className="px-4 py-5">
        {nc ? (
          <>
            <p className="font-display text-5xl font-semibold tabular-nums tracking-tight">{formatNC(nc.nc, nf)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {fill(t.ncHint, { p: formatPoints(nc.points, nf), n: nc.subjects })}
            </p>
            <p className="mt-3 text-xs text-muted-foreground/80">{t.ncFormula}</p>
          </>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">{t.ncEmpty}</p>
        )}
      </div>
    </Panel>
  );
}

function CommunitiesCard({ list }: { list: Community[] }) {
  const { dict } = useI18n();
  const t = dict.communities;
  return (
    <Panel title={t.title} action={<PanelLink href="/communities">{list.length ? t.title : t.create}</PanelLink>}>
      {list.length === 0 ? (
        <Link href="/communities" className="flex items-center gap-3 px-4 py-4 text-sm text-muted-foreground hover:text-foreground">
          <Users size={16} aria-hidden />
          {t.empty}
        </Link>
      ) : (
        <ul className="grid sm:grid-cols-2">
          {list.slice(0, 6).map((c) => (
            <li key={c.id} className="border-b sm:odd:border-e [&:nth-last-child(-n+2)]:sm:border-b-0 last:border-b-0">
              <Link href={`/communities/view?id=${c.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/60">
                <CommunityAvatar name={c.name} className="size-7 text-xs" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium" dir="auto">
                  {c.name}
                </span>
                <span className="text-xs text-muted-foreground">{c.members === 1 ? t.oneMember : fill(t.members, { n: c.members })}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="h-44 animate-pulse rounded-xl border bg-card" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl border bg-card" />
        <div className="h-48 animate-pulse rounded-xl border bg-card" />
      </div>
      <div className="h-24 animate-pulse rounded-xl border bg-card" />
    </div>
  );
}
