"use client";

import { SubjectIcon } from "@/components/subject-icon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { Leaderboard } from "@/components/compare/leaderboard";
import { ProfileCard } from "@/components/compare/profile-card";
import { Loaded } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { SlidingIndicator } from "@/components/sliding-indicator";
import { normaliseBoard, type SubjectBoard } from "@/lib/compare";
import { must, useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import { CURRENT_SEMESTER, formatScore } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatSemester } from "@/lib/i18n/dictionaries";
import { getDisplayScale } from "@/lib/mutations/grades";
import { isSubjectId, SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// /compare?subject=bio
export default function ComparePage() {
  return (
    <Suspense>
      <CompareLoader />
    </Suspense>
  );
}

async function loadCompare(asked: string, userId: string) {
  const supabase = createClient();
  // Default subject: the one asked for, else the first subject that has tests.
  let subject: SubjectId;
  if (isSubjectId(asked)) {
    subject = asked;
  } else {
    const first = must(await supabase.from("quizzes").select("subject").order("subject").limit(1).maybeSingle()) as {
      subject: string;
    } | null;
    subject = first && isSubjectId(first.subject) ? first.subject : SUBJECT_IDS[0];
  }
  const [profile, shares, board] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("user_id", userId).maybeSingle(),
    supabase.from("grade_shares").select("subject"),
    supabase.rpc("get_subject_board", { p_subject: subject, p_semester: CURRENT_SEMESTER }),
  ]);
  return {
    subject,
    nickname: (must(profile) as { nickname: string } | null)?.nickname ?? "",
    shared: must(shares).map((s) => s.subject as SubjectId),
    board: must(board) as SubjectBoard,
    scale: getDisplayScale(),
  };
}

function CompareLoader() {
  const asked = useSearchParams().get("subject") ?? "";
  const { userId } = useAuth();
  const { dict } = useI18n();
  const state = useLoad(() => loadCompare(asked, userId), `compare:${asked}`);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero back={{ href: "/", label: dict.school.backHome }} title={dict.compare.title} subtitle={dict.compare.subtitle} />
      <div className="mt-6">
        <Loaded state={state}>{(data) => <CompareView {...data} />}</Loaded>
      </div>
    </div>
  );
}

function CompareView({ subject, nickname, shared, board, scale }: Awaited<ReturnType<typeof loadCompare>>) {
  const { locale, dict } = useI18n();
  const t = dict.compare;
  const data = board;
  const tests = normaliseBoard(data.tests);
  const grades = normaliseBoard(data.grades);
  const sharedSubjects = shared;
  const sharesThis = sharedSubjects.includes(subject);
  const myGrade = data.my_grade === null ? null : Number(data.my_grade);

  const nf = intlLocale(locale);
  const pct = (v: number) => `${Math.round(v * 100)} %`;
  const gradeFmt = (v: number) => formatScore(v, scale, nf);
  const labels = { you: t.you, average: t.average, people: t.people };
  const [view, setView] = useState<"tests" | "grades">("tests");

  return (
    <div className="flex flex-col gap-8">
      <nav className="-mx-4 overflow-x-auto px-4" aria-label={dict.grades.subject}>
        <div className="flex w-max gap-1.5 md:w-auto md:flex-wrap">
          {SUBJECT_IDS.map((id) => (
            <Link
              key={id}
              href={`/compare?subject=${id}`}
              aria-current={id === subject ? "page" : undefined}
              className={cn(
                "press whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium",
                id === subject ? "border-transparent bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <SubjectIcon subject={id} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />{SUBJECTS[id].label[locale]}
            </Link>
          ))}
        </div>
      </nav>

      {/* One ranking at a time */}
      <section>
        <div className="relative grid grid-cols-2 rounded-full border bg-card p-1 sm:inline-grid sm:min-w-80">
          <span className="absolute inset-1">
            <SlidingIndicator count={2} index={view === "tests" ? 0 : 1} className="inset-0 rounded-full bg-[#38332c]" />
          </span>
          {(["tests", "grades"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "press relative rounded-full px-4 py-2 text-sm font-medium",
                view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "tests" ? dict.subject.mockExams : t.grades}
            </button>
          ))}
        </div>

        <div key={view} className="enter mt-5">
          {view === "tests" ? (
            <Leaderboard
              board={tests}
              format={pct}
              extra={(n) => (n === 1 ? t.oneTest : fill(t.testsCount, { n }))}
              labels={{ ...labels, empty: t.noResults }}
            />
          ) : (
            <>
              {!sharesThis && <p className="mb-3 text-sm text-muted-foreground">{t.notShared}</p>}
              <Leaderboard
                board={grades}
                format={gradeFmt}
                extra={(n) => (n === 1 ? dict.grades.oneGrade : fill(t.gradesCount, { n }))}
                labels={{ ...labels, empty: t.noShares }}
              />
              {myGrade !== null && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.myGrade}: <span className="font-semibold text-foreground tabular-nums">{gradeFmt(myGrade)}</span>
                </p>
              )}
            </>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {view === "tests" ? t.testsHint : `${t.gradesHint} ${formatSemester(CURRENT_SEMESTER, dict)}.`}
          </p>
        </div>
      </section>

      <ProfileCard nickname={nickname} shared={sharedSubjects} />
    </div>
  );
}
