"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/auth-gate";
import { Leaderboard } from "@/components/compare/leaderboard";
import { MeVsAverage } from "@/components/compare/me-vs-average";
import { ProfileCard } from "@/components/compare/profile-card";
import { Loaded } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { normaliseBoard, type SubjectBoard } from "@/lib/compare";
import { must, useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import { CURRENT_SEMESTER, formatScore } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatSemester } from "@/lib/i18n/dictionaries";
import { getDisplayScale } from "@/lib/mutations/grades";
import { isSubjectId, SUBJECT_IDS, SUBJECTS, subjectGradient, type SubjectId } from "@/lib/subjects";
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
  const quizzes = (data.quizzes ?? []).map((q) => ({
    ...q,
    average: q.average === null ? null : Number(q.average),
    mine: q.mine === null ? null : Number(q.mine),
  }));

  const takenQuizzes = quizzes.filter((q) => q.participants > 0);
  const nf = intlLocale(locale);
  const pct = (v: number) => `${Math.round(v * 100)} %`;
  const gradeFmt = (v: number) => formatScore(v, scale, nf);
  const labels = { you: t.you, average: t.average, people: t.people };

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
                "whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-all",
                id === subject ? "border-transparent text-white shadow-md" : "bg-card hover:bg-accent",
              )}
              style={id === subject ? { backgroundImage: subjectGradient(id) } : undefined}
            >
              {SUBJECTS[id].emoji} {SUBJECTS[id].label[locale]}
            </Link>
          ))}
        </div>
      </nav>

      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">
          {t.tests} · {SUBJECTS[subject].label[locale]}
        </h2>
        <Leaderboard
          board={tests}
          format={pct}
          extra={(n) => (n === 1 ? t.oneTest : fill(t.testsCount, { n }))}
          labels={{ ...labels, empty: t.noResults }}
          note={t.testsHint}
        />
      </section>

      {/* Only tests somebody has taken: the rest would just say "0 people". */}
      {takenQuizzes.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">{t.meVsAverage}</h2>
          <MeVsAverage
            quizzes={takenQuizzes}
            labels={{
              you: t.you,
              average: t.average,
              notTaken: t.notTaken,
              people: (n) => (n === 1 ? t.onePerson : fill(t.participants, { n })),
            }}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold tracking-tight">
          {t.grades} · {SUBJECTS[subject].label[locale]} · {formatSemester(CURRENT_SEMESTER, dict)}
        </h2>
        {myGrade !== null && (
          <p className="mb-2 text-sm text-muted-foreground">
            {t.myGrade}: <span className="font-semibold text-foreground tabular-nums">{gradeFmt(myGrade)}</span>
          </p>
        )}
        {!sharesThis && <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">{t.notShared}</p>}
        <Leaderboard
          board={grades}
          format={gradeFmt}
          extra={(n) => (n === 1 ? dict.grades.oneGrade : fill(t.gradesCount, { n }))}
          labels={{ ...labels, empty: t.noShares }}
          note={t.gradesHint}
        />
      </section>

      <ProfileCard nickname={nickname} shared={sharedSubjects} />
    </div>
  );
}
