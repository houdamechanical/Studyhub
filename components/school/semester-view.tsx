"use client";

import { useAuth } from "@/components/auth-gate";
import Link from "next/link";
import { BigTile } from "@/components/big-tile";
import { PageHero } from "@/components/page-hero";
import { SlidingIndicator } from "@/components/sliding-indicator";
import { SUBJECT_ICONS } from "@/components/subject-icon";
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

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {subjects.map((id, i) => {
          const info = SUBJECTS[id];
          const pages = content.filter((c) => c.subject === id).length;
          const c = counts?.[id] ?? { tests: 0, decks: 0 };
          return (
            <BigTile
              key={id}
              size="md"
              href={subjectHref(id, semester)}
              icon={SUBJECT_ICONS[id]}
              title={info.label[locale]}
              subtitle={
                hasPractice && state.loading ? (
                  <span className="inline-block h-3 w-20 animate-pulse rounded bg-muted align-middle" />
                ) : (
                  summary(pages, c.tests, c.decks, dict)
                )
              }
              delay={40 + i * 50}
            />
          );
        })}
      </div>
    </div>
  );
}
