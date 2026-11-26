import { CURRENT_SEMESTER } from "@/lib/grades";
import type { SubjectId } from "@/lib/subjects";

/**
 * School structure: grade (11, 12) → half-year (1, 2) → subjects.
 * A semester id is "<grade>.<half>", e.g. "11.1" = grade 11, 1st half-year.
 */
export const SCHOOL_GRADES = ["11", "12"] as const;
export type SchoolGrade = (typeof SCHOOL_GRADES)[number];
export const HALVES = ["1", "2"] as const;
export type Half = (typeof HALVES)[number];

/** Grades students can open. Grade 12 shows "coming soon" until it's added here. */
export const OPEN_GRADES: readonly SchoolGrade[] = ["11"];

/**
 * Mini tests, mock exams and flashcards don't have a half-year in the database
 * yet, so they are shown in the current one.
 */
export const PRACTICE_SEMESTER = CURRENT_SEMESTER;

export function isSchoolGrade(v: string): v is SchoolGrade {
  return (SCHOOL_GRADES as readonly string[]).includes(v);
}
export function isHalf(v: string): v is Half {
  return (HALVES as readonly string[]).includes(v);
}

export function splitSemester(semester: string): { grade: string; half: string } {
  const [grade = "11", half = "1"] = semester.split(".");
  return { grade, half };
}

export const CURRENT = splitSemester(CURRENT_SEMESTER);

export function gradeHref(grade: string) {
  return `/grade/${grade}`;
}
export function semesterHref(semester: string = CURRENT_SEMESTER) {
  const { grade, half } = splitSemester(semester);
  return `/grade/${grade}/${half}`;
}
export function subjectHref(subject: SubjectId, semester: string = CURRENT_SEMESTER) {
  return `${semesterHref(semester)}/${subject}`;
}
