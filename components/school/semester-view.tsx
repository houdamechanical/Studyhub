"use client";

import { useAuth } from "@/components/auth-gate";
import Link from "next/link";
import { SubjectBook } from "@/components/subject-book";
import { PageHero } from "@/components/page-hero";
import { SlidingIndicator } from "@/components/sliding-indicator";
import { getAllContent } from "@/lib/content";
import { must, useLoad } from "@/lib/data";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatPageCount, type Dictionary } from "@/lib/i18n/dictionaries";
import { CURRENT, gradeHref, HALVES, PRACTICE_SEMESTER, semesterHref, splitSemester, subjectHref } from "@/lib/school";
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

/** /grade/11/1 – all subjects of a half-year, every one with the same tile. */
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
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero
        back={{ href: gradeHref(grade), label: fill(t.grade, { grade }) }}
        eyebrow={`${fill(t.grade, { grade })} · ${half === "1" ? t.half1 : t.half2}`}
        title={t.pickSubject}
        aside={
          <div className="relative grid grid-cols-2 rounded-full border bg-card p-1" role="group">
            <span className="absolute inset-1">
              <SlidingIndicator count={2} index={half === "1" ? 0 : 1} className="inset-0 rounded-full bg-[var(--c-pill)]" />
            </span>
            {HALVES.map((h) => {
              const active = h === half;
              return (
                <Link
                  key={h}
                  href={semesterHref(`${grade}.${h}`)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press relative rounded-full px-4 py-2 text-center text-sm font-bold",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {grade}.{h}
                  {grade === CURRENT.grade && h === CURRENT.half && !active && (
                    <span className="ms-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
                  )}
                </Link>
              );
            })}
          </div>
        }
      />

      {/* Every subject as a book on a shelf */}
      <ul className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-6">
        {subjects.map((id, i) => {
          const info = SUBJECTS[id];
          const pages = content.filter((c) => c.subject === id).length;
          const c = counts?.[id] ?? { tests: 0, decks: 0 };
          const label = info.label[locale];
          return (
            <li key={id} className="enter" style={{ animationDelay: `${30 + i * 35}ms` }}>
              <Link href={subjectHref(id, semester)} className="group block outline-none" aria-label={label}>
                <SubjectBook
                  subject={id}
                  label={label}
                  className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:-rotate-1 group-focus-visible:-translate-y-1.5 group-active:scale-[0.98]"
                />
                <span className="mt-2.5 block truncate text-sm font-medium group-hover:text-[var(--c-amber)]">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {hasPractice && state.loading ? (
                    <span className="inline-block h-3 w-16 animate-pulse rounded bg-muted align-middle" />
                  ) : (
                    summary(pages, c.tests, c.decks, dict) || "\u00a0"
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
