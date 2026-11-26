import type { SubjectId } from "@/lib/subjects";

export const SCALES = ["grade", "points", "percent"] as const;
export type Scale = (typeof SCALES)[number];
export const SCALE_COOKIE = "grade_scale";
export const CURRENT_SEMESTER = "11.1";

export type Grade = {
  id: string;
  subject: SubjectId;
  semester: string;
  title: string;
  scale: Scale;
  value: number;
  weight: number;
  graded_on: string; // YYYY-MM-DD
};

export const SCALE_RANGE: Record<Scale, { min: number; max: number; step: number }> = {
  grade: { min: 1, max: 6, step: 0.1 },
  points: { min: 0, max: 15, step: 1 },
  percent: { min: 0, max: 100, step: 0.5 },
};

export function isScale(value: unknown): value is Scale {
  return typeof value === "string" && (SCALES as readonly string[]).includes(value);
}

/**
 * Every grade is turned into a score from 0 (worst) to 1 (best) so that grades
 * written on different scales can be averaged together. The mapping is linear:
 *   grade 1.0 → 1, grade 6.0 → 0
 *   15 points → 1, 0 points → 0
 *   100 %     → 1, 0 %      → 0
 */
export function toScore(scale: Scale, value: number) {
  switch (scale) {
    case "grade":
      return (6 - value) / 5;
    case "points":
      return value / 15;
    case "percent":
      return value / 100;
  }
}

export function fromScore(scale: Scale, score: number) {
  switch (scale) {
    case "grade":
      return 6 - score * 5;
    case "points":
      return score * 15;
    case "percent":
      return score * 100;
  }
}

/** Weighted average score of a list of grades, or null if empty. */
export function averageScore(grades: Grade[]): number | null {
  let sum = 0;
  let weights = 0;
  for (const g of grades) {
    sum += toScore(g.scale, g.value) * g.weight;
    weights += g.weight;
  }
  return weights > 0 ? sum / weights : null;
}

export type SubjectAverage = { subject: SubjectId; score: number; count: number; mixedScales: boolean };

export function subjectAverages(grades: Grade[]): SubjectAverage[] {
  const bySubject = new Map<SubjectId, Grade[]>();
  for (const g of grades) bySubject.set(g.subject, [...(bySubject.get(g.subject) ?? []), g]);
  return [...bySubject.entries()].map(([subject, list]) => ({
    subject,
    score: averageScore(list)!,
    count: list.length,
    mixedScales: new Set(list.map((g) => g.scale)).size > 1,
  }));
}

/** Half-year average: every subject counts equally, like on a report card. */
export function semesterScore(grades: Grade[]): number | null {
  const subjects = subjectAverages(grades);
  if (subjects.length === 0) return null;
  return subjects.reduce((sum, s) => sum + s.score, 0) / subjects.length;
}

export type TimelinePoint = { grade: Grade; score: number; runningScore: number };

/**
 * Grades in date order, each with the running average up to and including it.
 * For "all subjects" the running average is the half-year average (subjects
 * weighted equally); for one subject it is that subject's weighted average.
 */
export function timeline(grades: Grade[]): TimelinePoint[] {
  const sorted = [...grades].sort((a, b) => a.graded_on.localeCompare(b.graded_on));
  return sorted.map((grade, i) => ({
    grade,
    score: toScore(grade.scale, grade.value),
    runningScore: semesterScore(sorted.slice(0, i + 1))!,
  }));
}

/** Format a value that is already on `scale`. */
export function formatOnScale(scale: Scale, value: number, intlLocale: string, precise = false) {
  const digits = scale === "grade" ? (precise ? 2 : 1) : scale === "points" ? (precise ? 1 : 0) : precise ? 1 : 0;
  const text = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: scale === "grade" ? digits : 0,
    maximumFractionDigits: digits,
  }).format(value);
  return scale === "percent" ? `${text} %` : text;
}

/** Format a 0–1 score on the chosen display scale (averages use 2 decimals for grades). */
export function formatScore(score: number, scale: Scale, intlLocale: string) {
  return formatOnScale(scale, fromScore(scale, score), intlLocale, true);
}
