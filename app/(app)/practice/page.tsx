"use client";

import { Loaded, PageShell } from "@/components/page-shell";
import { PracticeHub, type DeckSummary, type QuizSummary } from "@/components/practice/practice-hub";
import { must, useLoad } from "@/lib/data";
import { useI18n } from "@/lib/i18n/client";
import type { QuizKind } from "@/lib/practice";
import type { SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";

async function loadPractice() {
  const supabase = createClient();
  const [quizzes, decks, attempts, reviews] = await Promise.all([
    supabase.from("quizzes").select("id, kind, subject, topic, title, duration_minutes, quiz_questions(count)").order("title"),
    supabase.from("decks").select("id, subject, topic, title, cards(id)").order("title"),
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
    // null = never reviewed (new card)
    dueDates: d.cards.map((c: { id: string }) => dueByCard.get(c.id) ?? null),
  }));
  return { quizList, deckList };
}

export default function PracticePage() {
  const { dict } = useI18n();
  const state = useLoad(loadPractice, "practice");
  return (
    <PageShell title={dict.practice.title} subtitle={dict.practice.subtitle}>
      <Loaded state={state}>{({ quizList, deckList }) => <PracticeHub quizzes={quizList} decks={deckList} />}</Loaded>
    </PageShell>
  );
}
