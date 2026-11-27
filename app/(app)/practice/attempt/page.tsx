"use client";

import { subjectHref } from "@/lib/school";
import type { SubjectId } from "@/lib/subjects";

import { ArrowLeft, CircleCheck, CircleX, RotateCcw, TriangleAlert, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QuizBoardDialog } from "@/components/practice/quiz-board-dialog";
import { Loaded, NotFoundMessage } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { isUuid } from "@/lib/actions";
import { must, useLoad } from "@/lib/data";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill, type Dictionary } from "@/lib/i18n/dictionaries";
import type { GivenAnswer, ReviewItem, Solution } from "@/lib/practice";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AttemptRow = {
  id: string;
  quiz_id: string;
  submitted_at: string | null;
  over_time: boolean;
  score: number | string | null;
  max_score: number | string | null;
  review: unknown;
  quizzes: unknown;
};

// /practice/attempt?id=… (static site: ids come from the database, so they're query params)
export default function AttemptPage() {
  return (
    <Suspense>
      <AttemptLoader />
    </Suspense>
  );
}

function AttemptLoader() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { dict } = useI18n();
  useTitle(dict.quiz.result);
  const state = useLoad(async () => {
    if (!isUuid(id)) return { attempt: null };
    // RLS: only your own attempts are visible.
    const attempt = must(
      await createClient()
        .from("attempts")
        .select("id, quiz_id, submitted_at, over_time, score, max_score, review, quizzes(title, kind, subject)")
        .eq("id", id)
        .maybeSingle(),
    ) as AttemptRow | null;
    return { attempt };
  }, id);

  const attempt = state.data?.attempt;
  const unfinished = attempt && !attempt.submitted_at;
  useEffect(() => {
    if (unfinished) router.replace(`/practice/quiz?id=${attempt.quiz_id}`);
  }, [unfinished, attempt, router]);

  const justFinished = useSearchParams().get("done") === "1";
  return (
    <Loaded state={state}>
      {({ attempt }) =>
        attempt && attempt.submitted_at ? (
          <AttemptView attempt={attempt} dict={dict} justFinished={justFinished} />
        ) : (
          <NotFoundMessage />
        )
      }
    </Loaded>
  );
}

function AttemptView({ attempt, dict, justFinished }: { attempt: AttemptRow; dict: Dictionary; justFinished: boolean }) {
  const t = dict.quiz;
  const quiz = attempt.quizzes as unknown as { title: string; kind: "mock" | "mini"; subject: SubjectId } | null;
  const review = (attempt.review ?? []) as ReviewItem[];
  const score = Number(attempt.score);
  const max = Number(attempt.max_score);
  const percent = max > 0 ? Math.round((score / max) * 100) : 0;
  const correctCount = review.filter((r) => r.correct).length;
  // Mini tests aren't on the Leaderboard page: their board pops up right after finishing.
  const [boardOpen, setBoardOpen] = useState(justFinished && quiz?.kind === "mini");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <Link href={quiz ? subjectHref(quiz.subject) + (quiz.kind === "mock" ? "#mock" : "#mini") : "/home"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t.backToPractice}
      </Link>

      <section className="rounded-xl border bg-card shadow-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.result} · {quiz?.kind === "mock" ? t.mock : t.mini}
        </p>
        <h1 className="mt-1 text-xl font-semibold" dir="auto">{quiz?.title}</h1>
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-5xl font-semibold tabular-nums tracking-tight">{percent} %</p>
          <p className="pb-1 text-sm text-muted-foreground">
            {fill(t.correctCount, { c: correctCount, n: review.length })} · <bdi>{fmt(score)}/{fmt(max)} P</bdi>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-[var(--chart-accent)]" style={{ width: `${percent}%` }} />
        </div>
        {attempt.over_time && (
          <p className="mt-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <TriangleAlert size={16} />
            {t.overTime}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/practice/quiz?id=${attempt.quiz_id}`}>
              <RotateCcw size={16} />
              {t.tryAgain}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setBoardOpen(true)}>
            <Trophy size={16} />
            {dict.compare.leaderboard}
          </Button>
        </div>
      </section>

      {boardOpen && (
        <QuizBoardDialog quizId={attempt.quiz_id} title={quiz?.title ?? ""} onClose={() => setBoardOpen(false)} />
      )}

      <ol className="flex flex-col gap-3">
        {review.map((item, i) => (
          <ReviewCard key={item.question_id} item={item} index={i} dict={dict} />
        ))}
      </ol>
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function ReviewCard({ item, index, dict }: { item: ReviewItem; index: number; dict: Dictionary }) {
  const t = dict.quiz;
  const Icon = item.correct ? CircleCheck : CircleX;
  return (
    <li className="rounded-xl border bg-card shadow-card p-4">
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          className={cn("mt-0.5 shrink-0", item.correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}
          aria-label={item.correct ? "✓" : "✗"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {fill(t.question, { n: index + 1 })} · {fill(t.pointsShort, { n: item.correct ? item.points : 0 })} / {item.points}
          </p>
          <p className="mt-1 whitespace-pre-line font-medium" dir="auto">{item.prompt}</p>

          {item.type === "single" || item.type === "multi" ? (
            <ChoiceReview item={item} dict={dict} />
          ) : (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted/60 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{t.yourAnswer}</dt>
                <dd className={cn("font-medium", !item.correct && "text-red-700 dark:text-red-400")} dir="auto">
                  {givenText(item.given) || <span className="text-muted-foreground">{t.noAnswer}</span>}
                </dd>
              </div>
              {!item.correct && (
                <div className="rounded-lg bg-green-500/10 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{t.correctAnswer}</dt>
                  <dd className="font-medium" dir="auto">{solutionText(item.answer)}</dd>
                </div>
              )}
            </dl>
          )}

          {item.explanation.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.explanation}</p>
              <ol className="flex flex-col gap-2 text-sm">
                {item.explanation.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre-line" dir="auto">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function ChoiceReview({ item, dict }: { item: ReviewItem; dict: Dictionary }) {
  const correct = new Set(
    item.answer && "choice" in item.answer ? [item.answer.choice] : item.answer && "choices" in item.answer ? item.answer.choices : [],
  );
  const given = new Set(Array.isArray(item.given) ? item.given : typeof item.given === "number" ? [item.given] : []);
  return (
    <ul className="mt-3 flex flex-col gap-1.5 text-sm">
      {item.options.map((option, i) => {
        const isCorrect = correct.has(i);
        const picked = given.has(i);
        return (
          <li
            key={i}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2",
              isCorrect && "border-green-600/50 bg-green-500/10",
              picked && !isCorrect && "border-red-600/50 bg-red-500/10",
            )}
          >
            <span className="w-4 shrink-0 font-semibold" aria-hidden>
              {isCorrect ? "✓" : picked ? "✗" : ""}
            </span>
            <span className="flex-1 whitespace-pre-line" dir="auto">{option}</span>
            {picked && <span className="shrink-0 text-xs text-muted-foreground">{dict.quiz.yourAnswer}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function givenText(given: GivenAnswer) {
  if (given === null || given === undefined) return "";
  return Array.isArray(given) ? given.join(", ") : String(given);
}

function solutionText(answer: Solution | null) {
  if (!answer) return "–";
  if ("accepted" in answer) return answer.accepted.join(" / ");
  if ("value" in answer) return answer.tolerance ? `${answer.value} (± ${answer.tolerance})` : String(answer.value);
  return "";
}
