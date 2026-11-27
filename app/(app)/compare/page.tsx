"use client";

import { Check, Crown, Zap } from "lucide-react";
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
import { loadMiniBoard } from "@/lib/friends";
import { must, useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import { formatPoints } from "@/lib/gradebook";
import { CURRENT_SEMESTER, formatNC, ncFromScore, toPoints } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatSemester } from "@/lib/i18n/dictionaries";
import { setAllGradeShares, setGradeShare } from "@/lib/mutations/compare";
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
  };
}

function CompareLoader() {
  const params = useSearchParams();
  const asked = params.get("subject") ?? "";
  const mini = params.get("board") === "mini";
  const { dict } = useI18n();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero back={{ href: "/communities", label: dict.communities.title }} title={dict.compare.title} subtitle={dict.compare.subtitle} />
      <div className="mt-6 flex flex-col gap-8">
        <CompareTabs active={mini ? "mini" : isSubjectId(asked) ? asked : null} />
        {mini ? <MiniBoardView friends={params.get("scope") === "friends"} /> : <GradeBoardLoader asked={asked} />}
      </div>
    </div>
  );
}

function GradeBoardLoader({ asked }: { asked: string }) {
  const { userId } = useAuth();
  const state = useLoad(() => loadCompare(asked, userId), `compare:${asked}`);
  return <Loaded state={state}>{(data) => <CompareView {...data} />}</Loaded>;
}

/** Grade tabs (NC, then each subject) plus the mini-test XP board. */
function CompareTabs({ active }: { active: SubjectId | null | "mini" }) {
  const { locale, dict } = useI18n();
  const t = dict.compare;
  const tabs: { id: SubjectId | null | "mini"; label: string; href: string }[] = [
    { id: null, label: t.overall, href: "/compare" },
    { id: "mini", label: dict.friends.miniBoard, href: "/compare?board=mini" },
    ...SUBJECT_IDS.map((id) => ({ id, label: SUBJECTS[id].label[locale], href: `/compare?subject=${id}` })),
  ];
  return (
    <nav className="-mx-4 overflow-x-auto px-4" aria-label={dict.grades.subject}>
      <div className="flex w-max gap-1.5 md:w-auto md:flex-wrap">
        {tabs.map(({ id, label, href }) => {
          const on = id === active;
          return (
            <Link
              key={id ?? "overall"}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "press whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium",
                on ? "border-transparent bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {id === null ? (
                <Crown className="-mt-0.5 me-1 inline size-[1.05em] align-middle" aria-hidden />
              ) : id === "mini" ? (
                <Zap className="-mt-0.5 me-1 inline size-[1.05em] align-middle" aria-hidden />
              ) : (
                <SubjectIcon subject={id} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />
              )}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** XP from mini tests: everyone or just you and your friends. */
function MiniBoardView({ friends }: { friends: boolean }) {
  const { locale, dict } = useI18n();
  const t = dict.friends;
  const state = useLoad(() => loadMiniBoard(friends), `mini-board:${friends}`);
  const nf = new Intl.NumberFormat(intlLocale(locale));
  return (
    <section key={String(friends)} className="enter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{t.miniBoard}</h2>
        <div role="tablist" aria-label={t.miniBoard} className="grid w-full grid-cols-2 rounded-xl border bg-card p-1 shadow-card sm:w-auto">
          {[
            { on: !friends, label: t.scopeAll, href: "/compare?board=mini" },
            { on: friends, label: t.scopeFriends, href: "/compare?board=mini&scope=friends" },
          ].map((s) => (
            <Link
              key={s.href}
              href={s.href}
              role="tab"
              aria-selected={s.on}
              className={cn(
                "press whitespace-nowrap rounded-lg px-3 py-2.5 text-center text-sm font-semibold sm:px-4 sm:text-base",
                s.on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <Loaded state={state}>
          {({ missing, board }) =>
            missing ? (
              <SetupNotice problem="no-table" />
            ) : (
              <Leaderboard
                board={board}
                format={(v) => `${nf.format(Math.round(v))} XP`}
                extra={(n) => (n === 1 ? t.oneTest : fill(t.testsCount, { n }))}
                labels={{ you: dict.compare.you, average: dict.compare.average, people: dict.compare.people, empty: t.miniEmpty }}
              />
            )
          }
        </Loaded>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t.miniHint}</p>
    </section>
  );
}

function CompareView({ subject, missing, nickname, shared, board, myScore }: Awaited<ReturnType<typeof loadCompare>>) {
  const { locale, dict } = useI18n();
  const t = dict.compare;
  const [pending, startTransition] = useTransition();

  const nf = intlLocale(locale);
  // NC tab: the school's NC formula; subject tabs: points (0–15).
  const gradeFmt = (v: number) => (subject ? `${formatPoints(toPoints(v), nf)} P` : formatNC(ncFromScore(v), nf));
  const onBoard = subject ? shared.includes(subject) : shared.length > 0;

  function shareNow() {
    startTransition(async () => {
      const r = subject ? await setGradeShare(subject, true) : await setAllGradeShares(true);
      toast(r.ok ? t.shared : dict.common.error[r.error], r.ok ? "success" : "error");
    });
  }

  return (
    <div className="flex flex-col gap-8">

      <section key={subject ?? "overall"} className="enter">
        <h2 className="font-display text-2xl font-semibold">
          {subject ? SUBJECTS[subject].label[locale] : t.overall} · {formatSemester(CURRENT_SEMESTER, dict)}
        </h2>

        {missing ? (
          <div className="mt-5">
            <SetupNotice problem="no-table" />
          </div>
        ) : (
          <>
            {!onBoard && (
              <div className="mt-5 flex flex-col gap-3 rounded-xl border bg-card shadow-card p-4 sm:flex-row sm:items-center sm:justify-between">
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

      <ProfileCard key={shared.join(",")} nickname={nickname} shared={shared} part="share" />
    </div>
  );
}
