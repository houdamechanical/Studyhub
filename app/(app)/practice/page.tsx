import type { Metadata } from "next";
import { PracticeHub, type DeckSummary, type QuizSummary } from "@/components/practice/practice-hub";
import { isMissingTable, SetupNotice } from "@/components/setup-notice";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.practice.title };
}

export default async function PracticePage() {
  const { dict } = await getI18n();

  let content: React.ReactNode;
  if (!hasEnvVars) {
    content = <SetupNotice problem="no-env" />;
  } else {
    const supabase = await createClient();
    const [quizzes, decks, attempts, reviews] = await Promise.all([
      supabase
        .from("quizzes")
        .select("id, kind, subject, topic, title, duration_minutes, quiz_questions(count)")
        .order("title"),
      supabase.from("decks").select("id, subject, topic, title, cards(id)").order("title"),
      supabase.from("attempts").select("quiz_id, score, max_score").not("submitted_at", "is", null),
      supabase.from("card_reviews").select("card_id, due_on"),
    ]);
    const error = quizzes.error ?? decks.error ?? attempts.error ?? reviews.error;

    if (error) {
      console.error("load practice", error);
      content = <SetupNotice problem={isMissingTable(error) ? "no-table" : "error"} />;
    } else {
      // Best result (as a share of max score) and attempt count per quiz
      const stats = new Map<string, { best: number; count: number }>();
      for (const a of attempts.data ?? []) {
        const share = Number(a.max_score) > 0 ? Number(a.score) / Number(a.max_score) : 0;
        const s = stats.get(a.quiz_id) ?? { best: 0, count: 0 };
        stats.set(a.quiz_id, { best: Math.max(s.best, share), count: s.count + 1 });
      }
      const dueByCard = new Map((reviews.data ?? []).map((r) => [r.card_id, r.due_on as string]));

      const quizList: QuizSummary[] = (quizzes.data ?? []).map((q) => ({
        id: q.id,
        kind: q.kind,
        subject: q.subject,
        topic: q.topic,
        title: q.title,
        durationMinutes: q.duration_minutes,
        questionCount: (q.quiz_questions as unknown as { count: number }[])[0]?.count ?? 0,
        best: stats.get(q.id)?.best ?? null,
        attempts: stats.get(q.id)?.count ?? 0,
      }));
      const deckList: DeckSummary[] = (decks.data ?? []).map((d) => ({
        id: d.id,
        subject: d.subject,
        topic: d.topic,
        title: d.title,
        cardCount: d.cards.length,
        // null = never reviewed (new card)
        dueDates: d.cards.map((c) => dueByCard.get(c.id) ?? null),
      }));
      content = <PracticeHub quizzes={quizList} decks={deckList} />;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.practice.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{dict.practice.subtitle}</p>
      {content}
    </div>
  );
}
