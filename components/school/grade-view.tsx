"use client";

import { Leaf, Sprout } from "lucide-react";
import { BigTile, TileBadge } from "@/components/big-tile";
import { PageHero } from "@/components/page-hero";
import { getAllContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatPageCount } from "@/lib/i18n/dictionaries";
import { CURRENT, HALVES, OPEN_GRADES, semesterHref, type SchoolGrade } from "@/lib/school";

/** /grade/11 – pick the half-year. */
export function GradeView({ grade }: { grade: SchoolGrade }) {
  const { dict } = useI18n();
  const t = dict.school;
  const open = OPEN_GRADES.includes(grade);
  const content = getAllContent();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero
        back={{ href: "/", label: t.backHome }}
        title={fill(t.grade, { grade })}
        subtitle={open ? t.pickHalf : t.locked}
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-5">
        {HALVES.map((half, i) => {
          const semester = `${grade}.${half}`;
          const isNow = grade === CURRENT.grade && half === CURRENT.half;
          const pages = content.filter((c) => c.semester === semester).length;
          return (
            <BigTile
              key={half}
              href={open ? semesterHref(semester) : undefined}
              locked={!open}
              current={isNow}
              icon={half === "1" ? Leaf : Sprout}
              title={half === "1" ? t.half1 : t.half2}
              subtitle={formatPageCount(pages, dict)}
              badge={isNow ? <TileBadge dot>{t.now}</TileBadge> : undefined}
              delay={80 + i * 100}
            />
          );
        })}
      </div>
    </div>
  );
}
