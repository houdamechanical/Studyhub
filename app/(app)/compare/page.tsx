import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Leaderboard } from "@/components/compare/leaderboard";
import { MeVsAverage } from "@/components/compare/me-vs-average";
import { ProfileCard } from "@/components/compare/profile-card";
import { isMissingTable, SetupNotice } from "@/components/setup-notice";
import { normaliseBoard, type SubjectBoard } from "@/lib/compare";
import { intlLocale } from "@/lib/format";
import { CURRENT_SEMESTER, formatScore, isScale, SCALE_COOKIE } from "@/lib/grades";
import { fill, formatSemester } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";
import { isSubjectId, SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/server";
import { cn, hasEnvVars } from "@/lib/utils";

type Props = { searchParams: Promise<{ subject?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.compare.title };
}

export default async function ComparePage({ searchParams }: Props) {
  const { locale, dict } = await getI18n();
  const t = dict.compare;
  const header = (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t.subtitle}</p>
    </>
  );
  if (!hasEnvVars) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {header}
        <SetupNotice problem="no-env" />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  // Default subject: the one asked for, else the first subject that has tests.
  const asked = (await searchParams).subject ?? "";
  let subject: SubjectId;
  if (isSubjectId(asked)) {
    subject = asked;
  } else {
    const { data: first } = await supabase.from("quizzes").select("subject").order("subject").limit(1).maybeSingle();
    subject = first && isSubjectId(first.subject) ? first.subject : SUBJECT_IDS[0];
  }

  const [profile, shares, board] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("user_id", userId ?? "").maybeSingle(),
    supabase.from("grade_shares").select("subject"),
    supabase.rpc("get_subject_board", { p_subject: subject, p_semester: CURRENT_SEMESTER }),
  ]);
  const error = profile.error ?? shares.error ?? board.error;
  if (error) {
    console.error("load compare", error);
    const missing = isMissingTable(error) || error.code === "PGRST202";
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {header}
        <SetupNotice problem={missing ? "no-table" : "error"} />
      </div>
    );
  }

  const data = board.data as SubjectBoard;
  const tests = normaliseBoard(data.tests);
  const grades = normaliseBoard(data.grades);
  const sharedSubjects = (shares.data ?? []).map((s) => s.subject as SubjectId);
  const sharesThis = sharedSubjects.includes(subject);
  const myGrade = data.my_grade === null ? null : Number(data.my_grade);
  const quizzes = (data.quizzes ?? []).map((q) => ({
    ...q,
    average: q.average === null ? null : Number(q.average),
    mine: q.mine === null ? null : Number(q.mine),
  }));

  const nf = intlLocale(locale);
  const cookieScale = (await cookies()).get(SCALE_COOKIE)?.value;
  const scale = isScale(cookieScale) ? cookieScale : "grade";
  const pct = (v: number) => `${Math.round(v * 100)} %`;
  const gradeFmt = (v: number) => formatScore(v, scale, nf);
  const labels = { you: t.you, average: t.average, people: t.people };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <div>{header}</div>

      <ProfileCard nickname={profile.data?.nickname ?? ""} shared={sharedSubjects} />

      <nav className="-mx-4 overflow-x-auto px-4" aria-label={dict.grades.subject}>
        <div className="flex w-max gap-1.5 md:w-auto md:flex-wrap">
          {SUBJECT_IDS.map((id) => (
            <Link
              key={id}
              href={`/compare?subject=${id}`}
              aria-current={id === subject ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors",
                id === subject ? "border-foreground bg-foreground text-background" : "hover:bg-accent",
              )}
            >
              {SUBJECTS[id].emoji} {SUBJECTS[id].label[locale]}
            </Link>
          ))}
        </div>
      </nav>

      <section>
        <h2 className="mb-1 font-semibold">
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

      {quizzes.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">{t.meVsAverage}</h2>
          <MeVsAverage
            quizzes={quizzes}
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
        <h2 className="mb-1 font-semibold">
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
    </div>
  );
}
