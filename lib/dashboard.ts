"use client";

import { isMissingTable } from "@/components/setup-notice";
import { dueCount, type DeckSummary, type QuizSummary } from "@/lib/loaders";
import { SUBJECT_IDS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";

export type Task = {
  id: string;
  title: string;
  subject: SubjectId | null;
  due_on: string;
  done_at: string | null;
};

/** Local calendar date (YYYY-MM-DD) of a timestamp. */
export function localDay(ts: string | number | Date) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDay(day: string, by: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + by);
  return localDay(d);
}

/**
 * Today's tasks: everything planned for today or earlier that's still open
 * (unfinished tasks carry over), plus what was finished today.
 * `missing` = the tasks table doesn't exist yet (migration not run).
 */
export async function loadTasks(today: string): Promise<{ tasks: Task[]; missing: boolean }> {
  const startOfToday = new Date(`${today}T00:00:00`).toISOString();
  const { data, error } = await createClient()
    .from("tasks")
    .select("id, title, subject, due_on, done_at")
    .or(`and(done_at.is.null,due_on.lte.${today}),done_at.gte."${startOfToday}"`)
    .order("created_at");
  if (error) {
    if (isMissingTable(error)) return { tasks: [], missing: true };
    throw error;
  }
  return { tasks: (data ?? []) as Task[], missing: false };
}

const FOCUS_LOG = "studyhub:focus-log";

/** Finished focus sessions per local day (kept in this browser). */
export function readFocusLog(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(FOCUS_LOG) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function logFocusSession() {
  try {
    const log = readFocusLog();
    const day = localDay(Date.now());
    log[day] = (log[day] ?? 0) + 1;
    localStorage.setItem(FOCUS_LOG, JSON.stringify(log));
  } catch {}
}

/**
 * Days you studied: submitted tests, reviewed flashcards, finished tasks
 * (from the database) and focus sessions (this browser).
 */
export async function loadStudyDays(): Promise<{ days: Set<string>; tasksDone: number }> {
  const supabase = createClient();
  const [attempts, reviews, tasks] = await Promise.all([
    supabase.from("attempts").select("submitted_at").not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(500),
    supabase.from("card_reviews").select("last_reviewed_at").order("last_reviewed_at", { ascending: false }).limit(1000),
    supabase.from("tasks").select("done_at").not("done_at", "is", null).order("done_at", { ascending: false }).limit(500),
  ]);
  const days = new Set<string>();
  for (const a of attempts.data ?? []) days.add(localDay(a.submitted_at as string));
  for (const r of reviews.data ?? []) days.add(localDay(r.last_reviewed_at as string));
  for (const t of tasks.data ?? []) days.add(localDay(t.done_at as string)); // fine if the table doesn't exist yet
  for (const [day, n] of Object.entries(readFocusLog())) if (n > 0) days.add(day);
  return { days, tasksDone: (tasks.data ?? []).length };
}

/** Longest run of consecutive study days ever. */
export function longestStreak(days: Set<string>) {
  let best = 0;
  for (const day of days) {
    if (days.has(shiftDay(day, -1))) continue; // not the start of a run
    let n = 0;
    let d = day;
    while (days.has(d)) {
      n++;
      d = shiftDay(d, 1);
    }
    best = Math.max(best, n);
  }
  return best;
}

/** Days in a row ending today – or yesterday, so a streak isn't lost before you've studied today. */
export function streakLength(days: Set<string>, today: string) {
  let day = days.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (days.has(day)) {
    n++;
    day = shiftDay(day, -1);
  }
  return n;
}

export type SubjectProgress = {
  subject: SubjectId;
  /** 0–1: half tests taken, half flashcards learned (or all of one if the other is missing). */
  progress: number;
  testsTaken: number;
  tests: number;
  avgBest: number | null;
  cardsLearned: number;
  cards: number;
  due: number;
};

export function subjectProgress(quizzes: QuizSummary[], decks: DeckSummary[], today: string): SubjectProgress[] {
  return SUBJECT_IDS.flatMap((subject) => {
    const qs = quizzes.filter((q) => q.subject === subject);
    const ds = decks.filter((d) => d.subject === subject);
    const cards = ds.reduce((s, d) => s + d.cardCount, 0);
    if (qs.length === 0 && cards === 0) return [];
    const taken = qs.filter((q) => q.best !== null);
    const learned = ds.reduce((s, d) => s + d.dueDates.filter((x) => x !== null).length, 0);
    const parts = [qs.length ? taken.length / qs.length : null, cards ? learned / cards : null].filter(
      (x): x is number => x !== null,
    );
    return [
      {
        subject,
        progress: parts.reduce((s, x) => s + x, 0) / parts.length,
        testsTaken: taken.length,
        tests: qs.length,
        avgBest: taken.length ? taken.reduce((s, q) => s + (q.best ?? 0), 0) / taken.length : null,
        cardsLearned: learned,
        cards,
        due: ds.reduce((s, d) => s + dueCount(d, today), 0),
      },
    ];
  });
}
