"use client";

import { CalendarClock, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExamsView } from "@/components/exams/exams-view";
import { GradesView } from "@/components/grades/grades-view";
import { Loaded } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { SlidingIndicator } from "@/components/sliding-indicator";
import { must, useLoad } from "@/lib/data";
import type { Exam } from "@/lib/exams";
import { useI18n } from "@/lib/i18n/client";
import { loadGrades } from "@/lib/loaders";
import { getDisplayScale } from "@/lib/mutations/grades";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// /grades (grades) and /grades?tab=exams (exams): one page, two tabs.
export default function GradesAndExamsPage() {
  return (
    <Suspense>
      <GradesAndExams />
    </Suspense>
  );
}

function GradesAndExams() {
  const { dict } = useI18n();
  const tab = useSearchParams().get("tab") === "exams" ? "exams" : "grades";
  const tabs = [
    { id: "grades", href: "/grades", label: dict.grades.title, icon: GraduationCap },
    { id: "exams", href: "/grades?tab=exams", label: dict.exams.title, icon: CalendarClock },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero
        back={{ href: "/", label: dict.school.backHome }}
        title={dict.nav.gradesExams}
        subtitle={tab === "grades" ? dict.grades.subtitle : dict.exams.subtitle}
      />
      <nav className="relative mt-6 grid grid-cols-2 rounded-full border bg-card p-1.5 sm:inline-grid sm:min-w-80">
        <span className="absolute inset-1.5">
          <SlidingIndicator count={2} index={tab === "grades" ? 0 : 1} className="inset-0 rounded-full bg-white/[0.08]" />
        </span>
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={t.href}
              replace
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "press relative flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon size={16} strokeWidth={2} />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">{tab === "grades" ? <GradesTab /> : <ExamsTab />}</div>
    </div>
  );
}

function GradesTab() {
  const state = useLoad(async () => ({ grades: await loadGrades(), scale: getDisplayScale() }), "grades");
  return <Loaded state={state}>{({ grades, scale }) => <GradesView grades={grades} initialScale={scale} />}</Loaded>;
}

function ExamsTab() {
  const state = useLoad(
    async () =>
      must(
        await createClient()
          .from("exams")
          .select("id, subject, title, type, exam_date, start_time, room, status, notes")
          .order("exam_date"),
      ) as Exam[],
    "exams",
  );
  return <Loaded state={state}>{(exams) => <ExamsView exams={exams} />}</Loaded>;
}
