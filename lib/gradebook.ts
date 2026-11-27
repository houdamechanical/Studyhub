"use client";

import { isMissingTable } from "@/components/setup-notice";
import { dataChanged } from "@/lib/data";
import type { SchoolExam } from "@/lib/exams";
import { ncFromPoints } from "@/lib/grades";
import { loadSchoolExams } from "@/lib/loaders";
import type { SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";

/** Your result (0–15 points) for one exam of the school's plan. */
export type ExamGrade = { exam_id: string; points: number };
/** One of up to two oral grades (mündliche Note) per subject and half-year. */
export type OralGrade = { subject: SubjectId; slot: 1 | 2; points: number };

export type SubjectResult = {
  subject: SubjectId;
  /** average of the written exams, or null */
  written: number | null;
  /** average of the oral grades, or null */
  oral: number | null;
  /** half written + half oral (or whichever part exists) */
  points: number | null;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

/** Per subject: 50 % written average + 50 % oral average; one part alone if the other is missing. */
export function subjectResults(
  subjects: readonly SubjectId[],
  exams: SchoolExam[],
  examGrades: ExamGrade[],
  oral: OralGrade[],
): SubjectResult[] {
  const byExam = new Map(examGrades.map((g) => [g.exam_id, g.points]));
  return subjects.map((subject) => {
    const written = avg(exams.filter((e) => e.subject === subject && byExam.has(e.id)).map((e) => byExam.get(e.id)!));
    const o = avg(oral.filter((g) => g.subject === subject).map((g) => g.points));
    const points = written === null ? o : o === null ? written : (written + o) / 2;
    return { subject, written, oral: o, points };
  });
}

/** NC of the half-year from subject results (school sheet: (17 − Ø points) ÷ 3). */
export function ncFromResults(results: SubjectResult[]) {
  const graded = results.filter((r) => r.points !== null).map((r) => r.points!);
  if (graded.length === 0) return null;
  const points = graded.reduce((s, x) => s + x, 0) / graded.length;
  return { nc: ncFromPoints(points), points, subjects: graded.length };
}

/** Everything the grade book needs. `missing` = grades migration not applied yet. */
export async function loadGradeBook(subjects: readonly SubjectId[], semester: string) {
  const supabase = createClient();
  const [exams, eg, og] = await Promise.all([
    loadSchoolExams(subjects, { all: true }),
    supabase.from("exam_grades").select("exam_id, points"),
    supabase.from("oral_grades").select("subject, slot, points").eq("semester", semester),
  ]);
  const missing = isMissingTable(eg.error) || isMissingTable(og.error);
  if (!missing && (eg.error || og.error)) throw eg.error ?? og.error;
  return {
    exams,
    examGrades: missing ? [] : (eg.data as ExamGrade[]),
    oral: missing ? [] : (og.data as OralGrade[]),
    missing,
  };
}

const valid = (p: number | null) => p === null || (Number.isInteger(p) && p >= 0 && p <= 15);

/** Set (or clear with null) your result for an exam. */
export async function setExamGrade(examId: string, points: number | null) {
  if (!valid(points)) return false;
  const supabase = createClient();
  const { error } =
    points === null
      ? await supabase.from("exam_grades").delete().eq("exam_id", examId)
      : await supabase
          .from("exam_grades")
          .upsert({ exam_id: examId, points, updated_at: new Date().toISOString() }, { onConflict: "user_id,exam_id" });
  if (!error) dataChanged();
  return !error;
}

/** Set (or clear with null) oral grade 1 or 2 of a subject. */
export async function setOralGrade(semester: string, subject: SubjectId, slot: 1 | 2, points: number | null) {
  if (!valid(points)) return false;
  const supabase = createClient();
  const { error } =
    points === null
      ? await supabase.from("oral_grades").delete().eq("semester", semester).eq("subject", subject).eq("slot", slot)
      : await supabase
          .from("oral_grades")
          .upsert({ semester, subject, slot, points, updated_at: new Date().toISOString() }, { onConflict: "user_id,semester,subject,slot" });
  if (!error) dataChanged();
  return !error;
}

/** "12,5" / "12.5" points with one decimal (whole numbers without). */
export function formatPoints(points: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 }).format(points);
}
