import type { SubjectId } from "@/lib/subjects";

export const EXAM_TYPES = ["klausur", "test", "oral", "presentation", "other"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const EXAM_STATUSES = ["upcoming", "done"] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export type Exam = {
  id: string;
  subject: SubjectId;
  title: string;
  type: ExamType;
  exam_date: string; // YYYY-MM-DD (local wall-clock date)
  start_time: string | null; // HH:MM[:SS] or null
  room: string;
  status: ExamStatus;
  notes: string;
};

/** Local Date for the exam's start; without a time, the start of that day. */
export function examStart(exam: Pick<Exam, "exam_date" | "start_time">): Date {
  const time = exam.start_time ? exam.start_time.slice(0, 5) : "00:00";
  return new Date(`${exam.exam_date}T${time}:00`);
}

export function sortByDate<T extends Pick<Exam, "exam_date" | "start_time">>(list: T[], dir: 1 | -1 = 1) {
  return [...list].sort((a, b) => dir * (examStart(a).getTime() - examStart(b).getTime()));
}
