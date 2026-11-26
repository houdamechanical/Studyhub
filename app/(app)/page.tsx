"use client";

import { ChartNoAxesColumn, ChevronRight, GraduationCap, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-gate";
import { BigTile, TileBadge } from "@/components/big-tile";
import { SubjectIcon } from "@/components/subject-icon";
import { useLoad } from "@/lib/data";
import { formatDate, intlLocale } from "@/lib/format";
import { CURRENT_SEMESTER, formatScore, semesterScore } from "@/lib/grades";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { daysUntil, loadGrades, loadUpcomingExams } from "@/lib/loaders";
import { getDisplayScale } from "@/lib/mutations/grades";
import { CURRENT, gradeHref, OPEN_GRADES, SCHOOL_GRADES } from "@/lib/school";
import { SUBJECTS } from "@/lib/subjects";

async function loadHome() {
  const [exams, grades] = await Promise.all([loadUpcomingExams(), loadGrades(CURRENT_SEMESTER)]);
  return { exam: exams[0] ?? null, grades, scale: getDisplayScale() };
}

export default function HomePage() {
  const { nickname } = useAuth();
  const { locale, dict } = useI18n();
  const t = dict.home;
  useTitle(dict.nav.home);
  const { data } = useLoad(loadHome, "home");

  const avg = data ? semesterScore(data.grades) : null;
  const halfLabel = CURRENT.half === "1" ? dict.school.half1 : dict.school.half2;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-10 sm:pt-16">
      <section className="enter">
        <p className="text-base text-muted-foreground sm:text-lg">{t.welcome}</p>
        <h1 className="mt-1 break-words font-display text-4xl font-bold sm:text-6xl">
          <bdi>{nickname || "…"}</bdi>
        </h1>
      </section>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4">
        {SCHOOL_GRADES.map((g, i) => {
          const open = OPEN_GRADES.includes(g);
          const isCurrent = open && g === CURRENT.grade;
          return (
            <BigTile
              key={g}
              href={open ? gradeHref(g) : undefined}
              locked={!open}
              current={isCurrent}
              icon={GraduationCap}
              title={fill(t.grade, { grade: g })}
              subtitle={open ? (isCurrent ? fill(t.nowIn, { half: halfLabel }) : null) : t.comingSoon}
              badge={isCurrent ? <TileBadge dot>{dict.school.now}</TileBadge> : undefined}
              delay={60 + i * 50}
            />
          );
        })}
        <BigTile
          href="/grades"
          icon={ChartNoAxesColumn}
          title={t.gradesExams}
          subtitle={avg !== null && data ? fill(t.gradesHint, { avg: formatScore(avg, data.scale, intlLocale(locale)) }) : t.gradesEmpty}
          delay={170}
        />
        <BigTile href="/compare" icon={Trophy} title={t.leaderboard} subtitle={t.leaderboardHint} delay={210} />
      </div>

      {data?.exam && (
        <Link
          href="/grades?tab=exams"
          className="press enter mt-4 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 [animation-delay:260ms] hover:bg-accent"
        >
          <SubjectIcon subject={data.exam.subject} className="size-[18px] shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="text-muted-foreground">{t.nextExam}: </span>
            <span className="font-medium">{data.exam.title || SUBJECTS[data.exam.subject].label[locale]}</span>
            <span className="text-muted-foreground"> · {formatDate(data.exam.exam_date, locale, { day: "numeric", month: "short" })}</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-primary">{whenLabel(data.exam.exam_date, dict)}</span>
          <ChevronRight size={16} className="shrink-0 text-muted-foreground rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}

function whenLabel(date: string, dict: ReturnType<typeof useI18n>["dict"]) {
  const days = daysUntil(date);
  return days <= 0 ? dict.home.today : days === 1 ? dict.home.tomorrow : fill(dict.home.inDays, { n: days });
}
