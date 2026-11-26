"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteGrade, setDisplayScale } from "@/lib/mutations/grades";
import { GradeChart, GradeTable } from "@/components/grades/grade-chart";
import { GradeForm } from "@/components/grades/grade-form";
import { Button } from "@/components/ui/button";
import { controlClass, FormError } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { formatDate, intlLocale } from "@/lib/format";
import {
  CURRENT_SEMESTER,
  formatOnScale,
  formatScore,
  SCALES,
  semesterScore,
  subjectAverages,
  timeline,
  type Grade,
  type Scale,
} from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatGradeCount, formatSemester } from "@/lib/i18n/dictionaries";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const ALL = "all";

export function GradesView({ grades, initialScale }: { grades: Grade[]; initialScale: Scale }) {
  const { locale, dict } = useI18n();
  const t = dict.grades;
  const nf = intlLocale(locale);

  const [scale, setScale] = useState<Scale>(initialScale);
  const [, startScaleTransition] = useTransition();
  const semesters = [...new Set([CURRENT_SEMESTER, ...grades.map((g) => g.semester)])].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
  const [semester, setSemester] = useState<string>(CURRENT_SEMESTER);
  const [chartSubject, setChartSubject] = useState<SubjectId | typeof ALL>(ALL);
  const [asTable, setAsTable] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const inSemester = semester === ALL ? grades : grades.filter((g) => g.semester === semester);
  const overall = semesterScore(inSemester);
  const bySubject = subjectAverages(inSemester).sort((a, b) =>
    SUBJECTS[a.subject].label[locale].localeCompare(SUBJECTS[b.subject].label[locale], locale),
  );
  const chartGrades = chartSubject === ALL ? inSemester : inSemester.filter((g) => g.subject === chartSubject);
  const points = timeline(chartGrades);
  const usesConversion = inSemester.some((g) => g.scale !== scale);

  function changeScale(next: Scale) {
    setScale(next);
    startScaleTransition(() => setDisplayScale(next));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters: half-year + display scale, in one row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.semester}>
          {[...semesters, ALL].map((s) => {
            const score = semesterScore(s === ALL ? grades : grades.filter((g) => g.semester === s));
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSemester(s)}
                aria-pressed={semester === s}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  semester === s ? "border-foreground bg-foreground text-background" : "hover:bg-accent",
                )}
              >
                {/* <bdi> keeps "11.1" and "2.27" apart in right-to-left text */}
                <bdi>{s === ALL ? t.allSemesters : s}</bdi>
                {score !== null && (
                  <>
                    {" "}
                    <bdi className="ms-1 tabular-nums opacity-70">{formatScore(score, scale, nf)}</bdi>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t.showAs}
          <select
            className={cn(controlClass, "w-auto py-1")}
            value={scale}
            onChange={(e) => changeScale(e.target.value as Scale)}
          >
            {SCALES.map((s) => (
              <option key={s} value={s}>
                {t.scaleName[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Summary */}
      <section className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {semester === ALL ? t.allSemesters : `${t.semesterAverage} · ${formatSemester(semester, dict)}`}
          </p>
          <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">
            {overall === null ? "–" : formatScore(overall, scale, nf)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatGradeCount(inSemester.length, dict)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">{t.perSubject}</h2>
          {bySubject.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            <ul className="divide-y">
              {bySubject.map((s) => (
                <li key={s.subject} className="flex items-center gap-3 py-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: SUBJECTS[s.subject].color }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{SUBJECTS[s.subject].label[locale]}</span>
                  <span className="text-xs text-muted-foreground">{formatGradeCount(s.count, dict)}</span>
                  <span className="w-16 text-end font-semibold tabular-nums">{formatScore(s.score, scale, nf)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Chart */}
      {inSemester.length > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-medium">{t.chartTitle}</h2>
              <p className="text-xs text-muted-foreground">{t.chartSubtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className={cn(controlClass, "w-auto py-1")}
                value={chartSubject}
                onChange={(e) => setChartSubject(e.target.value as SubjectId | typeof ALL)}
                aria-label={t.subject}
              >
                <option value={ALL}>{t.allSubjects}</option>
                {bySubject.map((s) => (
                  <option key={s.subject} value={s.subject}>
                    {SUBJECTS[s.subject].label[locale]}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => setAsTable((v) => !v)}>
                {asTable ? t.showChart : t.showTable}
              </Button>
            </div>
          </div>
          {points.length === 0 ? null : asTable ? (
            <GradeTable points={points} scale={scale} />
          ) : (
            <GradeChart points={points} scale={scale} />
          )}
        </section>
      )}

      {/* List */}
      <section className="flex flex-col gap-2">
        {adding ? (
          <GradeForm
            defaultScale={scale}
            defaultSemester={semester === ALL ? undefined : semester}
            onDone={() => setAdding(false)}
          />
        ) : (
          <Button onClick={() => setAdding(true)} className="mb-2 self-start">
            <Plus size={16} />
            {t.add}
          </Button>
        )}
        <ul className="flex flex-col gap-2">
          {[...inSemester]
            .sort((a, b) => b.graded_on.localeCompare(a.graded_on))
            .map((grade) =>
              editingId === grade.id ? (
                <li key={grade.id}>
                  <GradeForm grade={grade} defaultScale={scale} onDone={() => setEditingId(null)} />
                </li>
              ) : (
                <GradeRow key={grade.id} grade={grade} onEdit={() => setEditingId(grade.id)} />
              ),
            )}
        </ul>
      </section>

      {usesConversion && <p className="text-xs text-muted-foreground">{t.mixedNote}</p>}
    </div>
  );
}

function GradeRow({ grade, onEdit }: { grade: Grade; onEdit: () => void }) {
  const { locale, dict } = useI18n();
  const nf = intlLocale(locale);
  const subject = SUBJECTS[grade.subject];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!confirm(dict.common.confirmDelete)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteGrade(grade.id);
      if (!result.ok) setError(dict.common.error[result.error]);
    });
  }

  return (
    <li className={cn("rounded-xl border bg-card px-4 py-3", pending && "opacity-60")}>
      <div className="flex items-center gap-3">
        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: subject.color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {subject.label[locale]}
            {grade.title && <span className="font-normal text-muted-foreground"> · <bdi>{grade.title}</bdi></span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(grade.graded_on, locale)}
            {grade.weight !== 1 && <> · {fill(dict.grades.weightShort, { w: new Intl.NumberFormat(nf).format(grade.weight) })}</>}
          </p>
        </div>
        <span className="text-lg font-semibold tabular-nums">{formatOnScale(grade.scale, grade.value, nf)}</span>
        <div className="flex shrink-0">
          <IconButton label={dict.common.edit} onClick={onEdit} disabled={pending}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label={dict.common.delete} onClick={remove} disabled={pending}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
      <div className="mt-2 empty:hidden">
        <FormError message={error} />
      </div>
    </li>
  );
}
