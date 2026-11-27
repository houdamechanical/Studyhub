"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { SetupNotice } from "@/components/setup-notice";
import { BOOK_COLORS } from "@/components/subject-book";
import { SubjectIcon } from "@/components/subject-icon";
import { toast } from "@/components/toast";
import { formatPeriods, type SchoolExam } from "@/lib/exams";
import { formatDate, intlLocale, todayISO } from "@/lib/format";
import {
  formatPoints,
  ncFromResults,
  setExamGrade,
  setOralGrade,
  subjectResults,
  type ExamGrade,
  type OralGrade,
} from "@/lib/gradebook";
import { CURRENT_SEMESTER, formatNC } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/**
 * Grades the way the school counts them: written points only for exams in the
 * plan, plus up to two oral grades per subject; each part is half the result.
 */
export function GradeBook({
  exams,
  examGrades: initialExam,
  oral: initialOral,
  missing,
}: {
  exams: SchoolExam[];
  examGrades: ExamGrade[];
  oral: OralGrade[];
  missing: boolean;
}) {
  const { locale, dict } = useI18n();
  const t = dict.grades;
  const { subjects } = useAuth();
  const nf = intlLocale(locale);
  // Local copies so a change shows instantly (rolled back if saving fails).
  const [examGrades, setExamGrades] = useState(initialExam);
  const [oral, setOral] = useState(initialOral);
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);

  if (missing) return <SetupNotice problem="no-table" />;

  const semesterExams = exams; // the plan holds the current half-year (11.1)
  const results = subjectResults(subjects, semesterExams, examGrades, oral);
  const nc = ncFromResults(results);

  async function saveExam(examId: string, points: number | null) {
    const before = examGrades;
    setExamGrades((g) => [...g.filter((x) => x.exam_id !== examId), ...(points === null ? [] : [{ exam_id: examId, points }])]);
    if (!(await setExamGrade(examId, points))) {
      setExamGrades(before);
      toast(dict.common.error.failed, "error");
    }
  }
  async function saveOral(subject: SubjectId, slot: 1 | 2, points: number | null) {
    const before = oral;
    setOral((g) => [...g.filter((x) => !(x.subject === subject && x.slot === slot)), ...(points === null ? [] : [{ subject, slot, points }])]);
    if (!(await setOralGrade(CURRENT_SEMESTER, subject, slot, points))) {
      setOral(before);
      toast(dict.common.error.failed, "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* NC summary */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-20 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--c-amber)_18%,transparent),transparent)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{dict.home.ncTitle}</p>
            <p className="font-display text-6xl font-bold tabular-nums tracking-tight">{nc ? formatNC(nc.nc, nf) : "–"}</p>
          </div>
          {nc && (
            <p className="text-muted-foreground">
              {fill(dict.home.ncHint, { p: formatPoints(nc.points, nf), n: nc.subjects })}
            </p>
          )}
        </div>
        <p className="relative mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
          {t.howItCounts}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {results.map((r) => {
          const subjectExams = semesterExams.filter((e) => e.subject === r.subject).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
          return (
            <section key={r.subject} className="overflow-hidden rounded-2xl border bg-card" style={{ "--subject": BOOK_COLORS[r.subject] } as React.CSSProperties}>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--subject)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
                  <SubjectIcon subject={r.subject} className="size-[18px]" />
                </span>
                <h2 className="flex-1 truncate text-lg font-semibold">{SUBJECTS[r.subject].label[locale]}</h2>
                <span className="text-end">
                  <span className="block font-display text-2xl font-bold tabular-nums leading-none">
                    {r.points === null ? "–" : formatPoints(r.points, nf)}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.result}</span>
                </span>
              </header>

              <div className="grid gap-px bg-border sm:grid-cols-[1.4fr_1fr]">
                <div className="bg-card px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.written} · 50 %</p>
                  {subjectExams.length === 0 ? (
                    <p className="py-1 text-sm text-muted-foreground">{t.noExamsSubject}</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {subjectExams.map((e) => {
                        const value = examGrades.find((g) => g.exam_id === e.id)?.points ?? null;
                        const future = today !== null && e.exam_date > today;
                        return (
                          <li key={e.id} className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 text-sm">
                              <span className="block truncate font-medium">
                                {formatDate(e.exam_date, locale, { day: "numeric", month: "short" })}
                                {e.title && <span className="font-normal text-muted-foreground"> · {e.title}</span>}
                              </span>
                              {e.periods && <span className="text-xs text-muted-foreground">{fill(dict.exams.lessons, { p: formatPeriods(e.periods) })}</span>}
                            </span>
                            {future ? (
                              <span className="rounded-lg border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground">{t.upcoming}</span>
                            ) : (
                              <PointsPicker
                                value={value}
                                label={fill(t.pointsOf, { name: `${SUBJECTS[r.subject].label[locale]} ${formatDate(e.exam_date, locale, { day: "numeric", month: "short" })}` })}
                                onChange={(p) => saveExam(e.id, p)}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="bg-card px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.oral} · 50 %</p>
                  <ul className="flex flex-col gap-1.5">
                    {([1, 2] as const).map((slot) => (
                      <li key={slot} className="flex items-center gap-3">
                        <span className="flex-1 text-sm font-medium">{fill(t.oralSlot, { n: slot })}</span>
                        <PointsPicker
                          value={oral.find((g) => g.subject === r.subject && g.slot === slot)?.points ?? null}
                          label={fill(t.pointsOf, { name: `${SUBJECTS[r.subject].label[locale]} ${fill(t.oralSlot, { n: slot })}` })}
                          onChange={(p) => saveOral(r.subject, slot, p)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {(r.written !== null || r.oral !== null) && (
                <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                  {[
                    r.written !== null ? fill(t.writtenAvg, { p: formatPoints(r.written, nf) }) : "",
                    r.oral !== null ? fill(t.oralAvg, { p: formatPoints(r.oral, nf) }) : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** A points button (0–15); tapping it opens a grid to pick or clear. */
function PointsPicker({ value, label, onChange }: { value: number | null; label: string; onChange: (p: number | null) => void }) {
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(p: number | null) {
    setOpen(false);
    if (p !== value) onChange(p);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "press flex h-9 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border px-2.5 text-sm font-semibold tabular-nums",
          value === null
            ? "border-dashed text-muted-foreground hover:border-[var(--c-amber)] hover:text-foreground"
            : "border-transparent bg-[color-mix(in_srgb,var(--subject)_16%,transparent)] text-foreground",
        )}
      >
        {value === null ? `+ ${dict.grades.addPoints}` : (
          <>
            {value}
            <span className="text-xs font-normal text-muted-foreground">{dict.grades.points}</span>
          </>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label={label} className="dialog-panel absolute end-0 top-full z-40 mt-1.5 w-56 rounded-xl border bg-popover p-2 shadow-xl">
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 16 }, (_, i) => 15 - i).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => pick(p)}
                aria-pressed={p === value}
                className={cn(
                  "press flex h-10 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
                  p === value ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  p >= 13 && p !== value && "text-[var(--c-sage)]",
                  p <= 4 && p !== value && "text-[var(--c-rose)]",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          {value !== null && (
            <button type="button" onClick={() => pick(null)} className="mt-1 w-full rounded-lg py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
              {dict.grades.clear}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
