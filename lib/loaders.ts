"use client";

import { must } from "@/lib/data";
import type { Exam } from "@/lib/exams";
import { sortByDate } from "@/lib/exams";
import { todayISO } from "@/lib/format";
import type { Grade } from "@/lib/grades";
import type { QuizKind } from "@/lib/practice";
import type { SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";

export type QuizSummary = {
  id: string;
  kind: QuizKind;
  subject: SubjectId;
  topic: string;
  title: string;
  durationMinutes: number | null;
  questionCount: number;
  best: number | null; // 0–1
  attempts: number;
};

export type DeckSummary = {
  id: string;
  subject: SubjectId;
  topic: string;
  title: string;
  cardCount: number;
  /** One entry per card: next due date, or null for a card never reviewed. */
  dueDates: (string | null)[];
};

/** Cards due today or earlier (new cards count as due). */
export function dueCount(deck: DeckSummary, today: string) {
  return deck.dueDates.filter((d) => d === null || d <= today).length;
}

/** Mini tests, mock exams and flashcard decks with your progress; optionally one subject only. */
export async function loadPractice(subject?: SubjectId) {
  const supabase = createClient();
  let quizQuery = supabase
    .from("quizzes")
    .select("id, kind, subject, topic, title, duration_minutes, quiz_questions(count)")
    .order("title");
  let deckQuery = supabase.from("decks").select("id, subject, topic, title, cards(id)").order("title");
  if (subject) {
    quizQuery = quizQuery.eq("subject", subject);
    deckQuery = deckQuery.eq("subject", subject);
  }
  const [quizzes, decks, attempts, reviews] = await Promise.all([
    quizQuery,
    deckQuery,
    supabase.from("attempts").select("quiz_id, score, max_score").not("submitted_at", "is", null),
    supabase.from("card_reviews").select("card_id, due_on"),
  ]);

  // Best result (as a share of max score) and attempt count per quiz
  const stats = new Map<string, { best: number; count: number }>();
  for (const a of must(attempts)) {
    const share = Number(a.max_score) > 0 ? Number(a.score) / Number(a.max_score) : 0;
    const s = stats.get(a.quiz_id) ?? { best: 0, count: 0 };
    stats.set(a.quiz_id, { best: Math.max(s.best, share), count: s.count + 1 });
  }
  const dueByCard = new Map(must(reviews).map((r) => [r.card_id, r.due_on as string]));

  const quizList: QuizSummary[] = must(quizzes).map((q) => ({
    id: q.id,
    kind: q.kind as QuizKind,
    subject: q.subject as SubjectId,
    topic: q.topic,
    title: q.title,
    durationMinutes: q.duration_minutes,
    questionCount: (q.quiz_questions as unknown as { count: number }[])[0]?.count ?? 0,
    best: stats.get(q.id)?.best ?? null,
    attempts: stats.get(q.id)?.count ?? 0,
  }));
  const deckList: DeckSummary[] = must(decks).map((d) => ({
    id: d.id,
    subject: d.subject as SubjectId,
    topic: d.topic,
    title: d.title,
    cardCount: d.cards.length,
    dueDates: d.cards.map((c: { id: string }) => dueByCard.get(c.id) ?? null),
  }));
  return { quizList, deckList };
}

/** Upcoming exams (today or later, not marked done), soonest first; optionally one subject. */
export async function loadUpcomingExams(subject?: SubjectId) {
  let query = createClient()
    .from("exams")
    .select("id, subject, title, type, exam_date, start_time, room, status, notes")
    .eq("status", "upcoming")
    .gte("exam_date", todayISO())
    .order("exam_date");
  if (subject) query = query.eq("subject", subject);
  return sortByDate(must(await query) as Exam[]);
}

export async function loadGrades(semester?: string) {
  let query = createClient()
    .from("grades")
    .select("id, subject, semester, title, scale, value, weight, graded_on")
    .order("graded_on");
  if (semester) query = query.eq("semester", semester);
  return (must(await query) as Grade[]).map((g) => ({ ...g, value: Number(g.value), weight: Number(g.weight) }));
}

/** Whole days from today until a YYYY-MM-DD date (0 = today). */
export function daysUntil(date: string) {
  const start = new Date(`${todayISO()}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}
