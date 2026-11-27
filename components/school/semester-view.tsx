"use client";

import { useAuth } from "@/components/auth-gate";
import Link from "next/link";
import { SubjectBook } from "@/components/subject-book";
import { getAllContent } from "@/lib/content";
import { must, useLoad } from "@/lib/data";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatPageCount, type Dictionary } from "@/lib/i18n/dictionaries";
import { CURRENT, HALVES, OPEN_GRADES, PRACTICE_SEMESTER, SCHOOL_GRADES, semesterHref, splitSemester, subjectHref } from "@/lib/school";
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Counts = Record<SubjectId, { tests: number; decks: number }>;

async function loadCounts(): Promise<Counts> {
  const supabase = createClient();
  const [quizzes, decks] = await Promise.all([
    supabase.from("quizzes").select("subject"),
    supabase.from("decks").select("subject"),
  ]);
  const counts = Object.fromEntries(SUBJECT_IDS.map((s) => [s, { tests: 0, decks: 0 }])) as Counts;
  for (const q of must(quizzes)) if (q.subject in counts) counts[q.subject as SubjectId].tests++;
  for (const d of must(decks)) if (d.subject in counts) counts[d.subject as SubjectId].decks++;
  return counts;
}

function summary(pages: number, tests: number, decks: number, dict: Dictionary) {
  const t = dict.school;
  const parts = [
    pages > 0 ? formatPageCount(pages, dict) : "",
    tests > 0 ? (tests === 1 ? t.oneTest : fill(t.tests, { n: tests })) : "",
    decks > 0 ? (decks === 1 ? t.oneDeck : fill(t.decks, { n: decks })) : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : t.nothingYet;
}

/** /grade/11/1 – pick the year and half-year, then a subject from the shelf of books. */
export function SemesterView({ semester }: { semester: string }) {
  const { subjects } = useAuth();
  const { locale, dict } = useI18n();
  const t = dict.school;
  const { grade, half } = splitSemester(semester);
  const content = getAllContent().filter((c) => c.semester === semester);
  // Tests and decks have no half-year yet: they belong to the current one.
  const hasPractice = semester === PRACTICE_SEMESTER;
  const state = useLoad(loadCounts, "subject-counts");
  const counts = hasPractice ? state.data : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
      <header className="enter flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {fill(t.grade, { grade })} · {half === "1" ? t.half1 : t.half2}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{t.shelfTitle}</h1>
        </div>
        <YearPicker grade={grade} half={half} />
      </header>

      {/* The shelf: every subject is a 3D book */}
      <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 sm:gap-x-8 md:grid-cols-4 xl:grid-cols-5">
        {subjects.map((id, i) => {
          const info = SUBJECTS[id];
          const pages = content.filter((c) => c.subject === id).length;
          const c = counts?.[id] ?? { tests: 0, decks: 0 };
          const label = info.label[locale];
          return (
            <li key={id} className="enter" style={{ animationDelay: `${30 + i * 40}ms` }}>
              <SubjectBook subject={id} label={label} href={subjectHref(id, semester)} />
              <p className="mt-5 truncate font-semibold">{label}</p>
              <p className="truncate text-sm text-muted-foreground">
                {hasPractice && state.loading ? (
                  <span className="inline-block h-3 w-16 animate-pulse rounded bg-muted align-middle" />
                ) : (
                  summary(pages, c.tests, c.decks, dict)
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Pick the year (grade 11 / 12) and the half-year. */
function YearPicker({ grade, half }: { grade: string; half: string }) {
  const { dict } = useI18n();
  const t = dict.school;
  return (
    <div className="flex flex-wrap gap-3">
      <Switch label={t.year}>
        {SCHOOL_GRADES.map((g) => {
          const open = OPEN_GRADES.includes(g);
          return (
            <SwitchItem key={g} href={open ? semesterHref(`${g}.${half}`) : undefined} active={g === grade} title={open ? undefined : t.locked}>
              {g}
              {!open && <span className="ms-1 text-xs font-normal opacity-70">{t.soon}</span>}
            </SwitchItem>
          );
        })}
      </Switch>
      <Switch label={t.halfYear}>
        {HALVES.map((h) => (
          <SwitchItem key={h} href={semesterHref(`${grade}.${h}`)} active={h === half}>
            {grade}.{h}
            {grade === CURRENT.grade && h === CURRENT.half && (
              <span className="ms-1.5 inline-block size-1.5 rounded-full bg-[var(--c-gold)] align-middle" aria-label={t.now} />
            )}
          </SwitchItem>
        ))}
      </Switch>
    </div>
  );
}

function Switch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 rounded-2xl border bg-card shadow-card p-1">
      <span className="px-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function SwitchItem({ href, active, title, children }: { href?: string; active: boolean; title?: string; children: React.ReactNode }) {
  const cls = cn(
    "press flex h-10 min-w-12 items-center justify-center rounded-xl px-3.5 text-base font-bold tabular-nums",
    active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
    !href && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
  );
  return href ? (
    <Link href={href} aria-current={active ? "page" : undefined} className={cls}>
      {children}
    </Link>
  ) : (
    <span className={cls} title={title} aria-disabled>
      {children}
    </span>
  );
}
