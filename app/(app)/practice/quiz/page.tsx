"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loaded, NotFoundMessage } from "@/components/page-shell";
import { QuizRunner } from "@/components/practice/quiz-runner";
import { isUuid } from "@/lib/actions";
import { must, useLoad } from "@/lib/data";
import { useTitle } from "@/lib/i18n/client";
import type { Question, Quiz } from "@/lib/practice";
import { createClient } from "@/lib/supabase/client";

// /practice/quiz?id=…
export default function QuizPage() {
  return (
    <Suspense>
      <QuizLoader />
    </Suspense>
  );
}

async function loadQuiz(id: string) {
  if (!isUuid(id)) return null;
  const supabase = createClient();
  const [quiz, items, attempts] = await Promise.all([
    supabase.from("quizzes").select("id, key, kind, subject, topic, title, description, duration_minutes").eq("id", id).maybeSingle(),
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
  const q = must(quiz) as Quiz | null;
  if (!q) return null;
  return {
    quiz: q,
    questions: must(items)
      .map((row) => row.questions as unknown as Question | null)
      .filter((x): x is Question => x !== null),
    attempts: must(attempts).map((a) => ({
      id: a.id,
      score: Number(a.score),
      maxScore: Number(a.max_score),
      submittedAt: a.submitted_at as string,
      overTime: a.over_time,
    })),
  };
}

function QuizLoader() {
  const id = useSearchParams().get("id") ?? "";
  const state = useLoad(() => loadQuiz(id), `quiz:${id}`);
  useTitle(state.data?.quiz.title);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Loaded state={state}>
        {(data) => (data ? <QuizRunner quiz={data.quiz} questions={data.questions} attempts={data.attempts} /> : <NotFoundMessage />)}
      </Loaded>
    </div>
  );
}
