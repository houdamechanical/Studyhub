"use client";

import { subjectHref } from "@/lib/school";
import type { SubjectId } from "@/lib/subjects";

import { ArrowLeft, CircleCheck, CircleX, RotateCcw, TriangleAlert, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QuizBoardDialog } from "@/components/practice/quiz-board-dialog";
import { Loaded, NotFoundMessage } from "@/components/page-shell";
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <Link href={quiz ? subjectHref(quiz.subject) + (quiz.kind === "mock" ? "#mock" : "#mini") : "/home"} className="press inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t.backToPractice}
      </Link>

      <section className="dark-card enter rounded-[28px] p-6 text-white sm:p-8">
        <p className="label-mono !text-white/55">
          {t.result} · {quiz?.kind === "mock" ? t.mock : t.mini}
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl" dir="auto" lang="de">
          {quiz?.title}
        </h1>
        <div className="mt-6 flex items-center gap-6">
          <ScoreRing percent={percent} />
          <dl className="grid flex-1 gap-3">
            <div>
              <dt className="label-mono !text-[0.62rem] !text-white/45">{t.statCorrect}</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">
                <bdi>
                  {correctCount} / {review.length}
                </bdi>
              </dd>
            </div>
            <div>
              <dt className="label-mono !text-[0.62rem] !text-white/45">{t.statPoints}</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">
                <bdi>
                  {fmt(score)} / {fmt(max)}
                </bdi>
              </dd>
            </div>
          </dl>
        </div>
        {attempt.over_time && (
          <p className="mt-4 flex items-center gap-2 text-sm text-amber-300">
            <TriangleAlert size={16} />
            {t.overTime}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Link href={`/practice/quiz?id=${attempt.quiz_id}`} className="press flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--hero-acc)] text-sm font-bold text-[#0e0c0a]">
            <RotateCcw size={16} />
            {t.tryAgain}
          </Link>
          <button type="button" onClick={() => setBoardOpen(true)} className="press flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 text-sm font-semibold hover:bg-white/10">
            <Trophy size={16} />
            {dict.compare.leaderboard}
          </button>
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

/** A thin ring that fills to the score. */
function ScoreRing({ percent }: { percent: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-28 shrink-0 sm:size-32">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="5" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--hero-acc)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(percent / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-semibold tabular-nums sm:text-4xl">{percent}%</span>
    </div>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function ReviewCard({ item, index, dict }: { item: ReviewItem; index: number; dict: Dictionary }) {
  const t = dict.quiz;
  const Icon = item.correct ? CircleCheck : CircleX;
  return (
    <li className="tile rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          className={cn("mt-0.5 shrink-0", item.correct ? "text-[var(--c-sage)]" : "text-destructive")}
          aria-label={item.correct ? "✓" : "✗"}
        />
        <div className="min-w-0 flex-1">
          <p className="label-mono">
            {String(index + 1).padStart(2, "0")} · {fill(t.pointsShort, { n: item.correct ? item.points : 0 })} / {item.points}
          </p>
          <p className="mt-2 whitespace-pre-line font-display text-lg font-medium leading-snug" dir="auto">{item.prompt}</p>

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
              <p className="label-mono mb-2">{t.explanation}</p>
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
              "flex items-start gap-2 rounded-xl border bg-background px-3 py-2.5",
              isCorrect && "border-[var(--c-sage)] bg-[color-mix(in_srgb,var(--c-sage)_10%,var(--c-bg))]",
              picked && !isCorrect && "border-destructive/60 bg-destructive/10",
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
