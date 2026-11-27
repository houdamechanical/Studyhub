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

/** Art teachers (short names as written in the Klausurplan). */
export const ART_TEACHERS = ["kng", "mcm"] as const;
export type ArtTeacher = (typeof ART_TEACHERS)[number];
export const ART_TEACHER_NAMES: Record<ArtTeacher, string> = { kng: "Kangas", mcm: "McCombie" };
export const isArtTeacher = (v: unknown): v is ArtTeacher => (ART_TEACHERS as readonly unknown[]).includes(v);

/** The signed-in student's Art teacher (set by AuthGate; null = none / not Art). */
let myArtTeacher: ArtTeacher | null = null;
export function setMyArtTeacher(t: ArtTeacher | null) {
  myArtTeacher = t;
}

/** An Art exam labelled with a teacher only counts for that teacher's students. */
export function isMyExam(e: Pick<SchoolExam, "subject" | "title">, teacher: ArtTeacher | null = myArtTeacher) {
  if (e.subject !== "kunst") return true;
  const label = e.title.trim().toLowerCase();
  if (!isArtTeacher(label)) return true; // no teacher on it: everyone in Art
  return label === teacher;
}

export function sortByDate<T extends Pick<SchoolExam, "exam_date">>(list: T[], dir: 1 | -1 = 1) {
  return [...list].sort((a, b) => dir * a.exam_date.localeCompare(b.exam_date));
}

/** "1-2" → "1–2" */
export const formatPeriods = (p: string) => p.replace("-", "–");

/** Date of the school's Klausurplan version in school_exams (shown as "updated …"). */
export const EXAM_PLAN_UPDATED = "2026-08-30";
