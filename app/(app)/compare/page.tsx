"use client";

import { Check, Crown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useAuth } from "@/components/auth-gate";
import { Leaderboard } from "@/components/compare/leaderboard";
import { ProfileCard } from "@/components/compare/profile-card";
import { Loaded } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { SetupNotice } from "@/components/setup-notice";
import { SubjectIcon } from "@/components/subject-icon";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { normaliseBoard, type GradeBoard } from "@/lib/compare";
import { must, useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import { CURRENT_SEMESTER, formatScore } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatSemester } from "@/lib/i18n/dictionaries";
import { setAllGradeShares, setGradeShare } from "@/lib/mutations/compare";
import { getDisplayScale } from "@/lib/mutations/grades";
import { isSubjectId, SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// /compare            -> overall grade leaderboard
// /compare?subject=bio -> one subject
export default function ComparePage() {
  return (
    <Suspense>
      <CompareLoader />
    </Suspense>
  );
}

async function loadCompare(asked: string, userId: string) {
  const supabase = createClient();
  const subject: SubjectId | null = isSubjectId(asked) ? asked : null;
  const [profile, shares, board] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("user_id", userId).maybeSingle(),
    supabase.from("grade_shares").select("subject"),
    supabase.rpc("get_grade_board", { p_subject: subject, p_semester: CURRENT_SEMESTER }),
  ]);
  // The leaderboard function comes with a migration; until it's applied, say so instead of failing.
  const missing = board.error?.code === "PGRST202" || board.error?.code === "42883";
  if (board.error && !missing) throw board.error;
  const data = missing ? null : (board.data as GradeBoard);
  return {
    subject,
    missing,
    nickname: (must(profile) as { nickname: string } | null)?.nickname ?? "",
    shared: must(shares).map((s) => s.subject as SubjectId),
    board: normaliseBoard(data?.board ?? { participants: 0, average: null, mine: null, rows: [] }),
    myScore: data?.my_score === null || data?.my_score === undefined ? null : Number(data.my_score),
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

function CompareView({ subject, missing, nickname, shared, board, myScore, scale }: Awaited<ReturnType<typeof loadCompare>>) {
  const { locale, dict } = useI18n();
  const t = dict.compare;
  const [pending, startTransition] = useTransition();

  const nf = intlLocale(locale);
  const gradeFmt = (v: number) => formatScore(v, scale, nf);
  const onBoard = subject ? shared.includes(subject) : shared.length > 0;

  function shareNow() {
    startTransition(async () => {
      const r = subject ? await setGradeShare(subject, true) : await setAllGradeShares(true);
      toast(r.ok ? t.shared : dict.common.error[r.error], r.ok ? "success" : "error");
    });
  }

  const tabs: { id: SubjectId | null; label: string }[] = [
    { id: null, label: t.overall },
    ...SUBJECT_IDS.map((id) => ({ id, label: SUBJECTS[id].label[locale] })),
  ];

  return (
    <div className="flex flex-col gap-8">
      <nav className="-mx-4 overflow-x-auto px-4" aria-label={dict.grades.subject}>
        <div className="flex w-max gap-1.5 md:w-auto md:flex-wrap">
          {tabs.map(({ id, label }) => {
            const active = id === subject;
            return (
              <Link
                key={id ?? "overall"}
                href={id ? `/compare?subject=${id}` : "/compare"}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium",
                  active ? "border-transparent bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {id ? (
                  <SubjectIcon subject={id} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />
                ) : (
                  <Crown className="-mt-0.5 me-1 inline size-[1.05em] align-middle" aria-hidden />
                )}
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <section key={subject ?? "overall"} className="enter">
        <p className="eyebrow">{subject ? SUBJECTS[subject].label[locale] : t.overall}</p>
        <h2 className="mt-2 font-display text-2xl">{formatSemester(CURRENT_SEMESTER, dict)}</h2>

        {missing ? (
          <div className="mt-5">
            <SetupNotice problem="no-table" />
          </div>
        ) : (
          <>
            {!onBoard && (
              <div className="mt-5 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{subject ? t.notShared : t.notSharedAny}</p>
                <Button onClick={shareNow} disabled={pending} className="shrink-0">
                  <Check size={16} />
                  {t.shareNow}
                </Button>
              </div>
            )}
            <div className="mt-5">
              <Leaderboard
                board={board}
                format={gradeFmt}
                extra={(n) => (n === 1 ? dict.grades.oneGrade : fill(t.gradesCount, { n }))}
                labels={{ you: t.you, average: t.average, people: t.people, empty: subject ? t.noShares : t.noSharesOverall }}
              />
            </div>
            {myScore !== null && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.myScore}: <span className="font-semibold tabular-nums text-foreground">{gradeFmt(myScore)}</span>
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{subject ? t.subjectHint : t.overallHint}</p>
          </>
        )}
      </section>

      <ProfileCard key={shared.join(",")} nickname={nickname} shared={shared} />
    </div>
  );
}
