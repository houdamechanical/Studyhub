"use client";

import { isMissingTable } from "@/components/setup-notice";
import { must } from "@/lib/data";
import { sortByDate, type SchoolExam } from "@/lib/exams";
import { todayISO } from "@/lib/format";
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
    .select("*, quiz_questions(count)")
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
    // Random mini tests: the number drawn per attempt, not the pool size.
    questionCount: (q.draw_count as number | null) ?? (q.quiz_questions as unknown as { count: number }[])[0]?.count ?? 0,
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

/**
 * The school's exam plan for the given subjects, soonest first. From today on
 * unless `all`. Empty (instead of an error) until the exam plan migration is applied.
 */
export async function loadSchoolExams(subjects: readonly SubjectId[], opts: { subject?: SubjectId; all?: boolean } = {}) {
  let query = createClient()
    .from("school_exams")
    .select("id, subject, exam_date, periods, classes, title")
    .in("subject", opts.subject ? [opts.subject] : [...subjects])
    .order("exam_date");
  if (!opts.all) query = query.gte("exam_date", todayISO());
  const { data, error } = await query;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return sortByDate(data as SchoolExam[]);
}

/** Whole days from today until a YYYY-MM-DD date (0 = today). */
export function daysUntil(date: string) {
  const start = new Date(`${todayISO()}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}
