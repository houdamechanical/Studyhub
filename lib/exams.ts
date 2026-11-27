import type { SubjectId } from "@/lib/subjects";

/** One exam from the school's plan (the same for everyone; see school_exams). */
export type SchoolExam = {
  id: string;
  subject: SubjectId;
  exam_date: string; // YYYY-MM-DD
  /** School lessons, e.g. "1-2" */
  periods: string;
  /** Only some classes, e.g. "11a-11c" ("" = the whole grade) */
  classes: string;
  /** Group or extra info, e.g. a teacher's short name */
  title: string;
};

export function sortByDate<T extends Pick<SchoolExam, "exam_date">>(list: T[], dir: 1 | -1 = 1) {
  return [...list].sort((a, b) => dir * a.exam_date.localeCompare(b.exam_date));
}

/** "1-2" → "1–2" */
export const formatPeriods = (p: string) => p.replace("-", "–");
