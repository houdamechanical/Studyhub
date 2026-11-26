import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/practice/quiz-runner";
import { SetupNotice } from "@/components/setup-notice";
import { isUuid } from "@/lib/actions";
import type { Question, Quiz } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

async function loadQuiz(id: string) {
  const supabase = await createClient();
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, key, kind, subject, topic, title, description, duration_minutes")
    .eq("id", id)
    .maybeSingle();
  return { supabase, quiz: quiz as Quiz | null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!hasEnvVars || !isUuid(id)) return {};
  const { quiz } = await loadQuiz(id);
  return quiz ? { title: quiz.title } : {};
}

export default async function QuizPage({ params }: Props) {
  const { id } = await params;
  if (!hasEnvVars) return <SetupNotice problem="no-env" />;
  if (!isUuid(id)) notFound();

  const { supabase, quiz } = await loadQuiz(id);
  if (!quiz) notFound();

  const [{ data: items }, { data: attempts }] = await Promise.all([
    supabase
      .from("quiz_questions")
      .select("position, questions(id, key, subject, topic, type, prompt, options, points)")
      .eq("quiz_id", id)
      .order("position"),
    supabase
      .from("attempts")
      .select("id, score, max_score, submitted_at, over_time")
      .eq("quiz_id", id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(10),
  ]);

  const questions = (items ?? [])
    .map((row) => row.questions as unknown as Question | null)
    .filter((q): q is Question => q !== null);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <QuizRunner
        quiz={quiz}
        questions={questions}
        attempts={(attempts ?? []).map((a) => ({
          id: a.id,
          score: Number(a.score),
          maxScore: Number(a.max_score),
          submittedAt: a.submitted_at as string,
          overTime: a.over_time,
        }))}
      />
    </div>
  );
}
