"use client";

import { ArrowLeft, Clock, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { startAttempt, submitAttempt } from "@/app/(app)/practice/actions";
import { Button } from "@/components/ui/button";
import { controlClass, FormError } from "@/components/ui/field";
import { intlLocale } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import type { GivenAnswer, Question, Quiz } from "@/lib/practice";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

type PastAttempt = { id: string; score: number; maxScore: number; submittedAt: string; overTime: boolean };
type Phase = "intro" | "running" | "submitting";

export function QuizRunner({
  quiz,
  questions,
  attempts,
}: {
  quiz: Quiz;
  questions: Question[];
  attempts: PastAttempt[];
}) {
  const { locale, dict } = useI18n();
  const t = dict.quiz;
  const router = useRouter();
  const subject = SUBJECTS[quiz.subject];

  const [phase, setPhase] = useState<Phase>("intro");
  const [timed, setTimed] = useState(quiz.kind === "mock" && quiz.duration_minutes !== null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, GivenAnswer>>({});
  const [error, setError] = useState<string | null>(null);

  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;

  async function start() {
    setError(null);
    const result = await startAttempt(quiz.id, timed);
    if (!result.ok) return setError(dict.common.error[result.error]);
    setAttemptId(result.attemptId);
    // Count down from the local clock; the server allows 30 s grace on top.
    setEndsAt(timed && quiz.duration_minutes ? Date.now() + quiz.duration_minutes * 60_000 : null);
    setPhase("running");
    window.scrollTo({ top: 0 });
  }

  const submittedRef = useRef(false);
  const submit = useCallback(
    async (force = false) => {
      if (!attemptId || submittedRef.current) return;
      const open = questions.length - questions.filter((q) => isAnswered(answers[q.id])).length;
      if (!force && open > 0 && !confirm(fill(t.confirmSubmit, { n: open }))) return;
      submittedRef.current = true;
      setPhase("submitting");
      const result = await submitAttempt(attemptId, answers);
      if (result.ok) {
        router.push(`/practice/attempt/${result.attemptId}`);
      } else {
        submittedRef.current = false;
        setPhase("running");
        setError(dict.common.error[result.error]);
      }
    },
    [attemptId, answers, questions, router, t.confirmSubmit, dict.common.error],
  );

  // Warn before leaving mid-test.
  useEffect(() => {
    if (phase !== "running") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/practice" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t.backToPractice}
        </Link>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {quiz.kind === "mock" ? t.mock : t.mini} · {subject.emoji} {subject.label[locale]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight" dir="auto">{quiz.title}</h1>
          {quiz.description && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground" dir="auto">{quiz.description}</p>}
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{fill(dict.practice.questions, { n: questions.length })}</span>
            {quiz.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {fill(dict.practice.minutes, { n: quiz.duration_minutes })}
              </span>
            )}
          </p>

          {quiz.duration_minutes && (
            <label className="mt-4 flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--chart-accent)]"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
              />
              <span>
                <span className="font-medium">{t.timedMode}</span>
                <span className="block text-muted-foreground">{timed ? t.timedHint : t.untimedHint}</span>
              </span>
            </label>
          )}

          <FormError message={error} />
          <Button className="mt-4" size="lg" onClick={start} disabled={questions.length === 0}>
            <Play size={16} />
            {t.start}
          </Button>
        </div>

        {attempts.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.previousAttempts}</h2>
            <ul className="divide-y rounded-xl border bg-card">
              {attempts.map((a) => (
                <li key={a.id}>
                  <Link href={`/practice/attempt/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent">
                    <span className="text-muted-foreground">
                      {new Intl.DateTimeFormat(intlLocale(locale), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(a.submittedAt))}
                    </span>
                    <span className="font-medium tabular-nums">
                      {a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0} %
                      <span className="ms-2 font-normal text-muted-foreground">
                        {formatPoints(a.score)}/{formatPoints(a.maxScore)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky status bar under the app header */}
      <div className="sticky top-14 z-30 -mx-4 flex items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur">
        {endsAt && <Countdown endsAt={endsAt} onElapsed={() => submit(true)} />}
        <span className="text-sm text-muted-foreground tabular-nums">
          {fill(t.answered, { a: answeredCount, n: questions.length })}
        </span>
        <Button className="ms-auto" size="sm" onClick={() => submit()} disabled={phase === "submitting"}>
          {phase === "submitting" ? dict.common.saving : t.submit}
        </Button>
      </div>

      <h1 className="text-lg font-semibold" dir="auto">{quiz.title}</h1>
      <FormError message={error} />

      <ol className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border bg-card p-4">
            <p className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{fill(t.question, { n: i + 1 })}</span>
              <span>{fill(t.pointsShort, { n: q.points })}</span>
            </p>
            <p className="mb-3 whitespace-pre-line font-medium" dir="auto">{q.prompt}</p>
            <AnswerInput
              question={q}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              disabled={phase === "submitting"}
            />
          </li>
        ))}
      </ol>

      <Button size="lg" onClick={() => submit()} disabled={phase === "submitting"} className="self-end">
        {phase === "submitting" ? dict.common.saving : t.submit}
      </Button>
    </div>
  );
}

function isAnswered(v: GivenAnswer | undefined) {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

const formatPoints = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function AnswerInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: Question;
  value: GivenAnswer;
  onChange: (v: GivenAnswer) => void;
  disabled: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.quiz;

  if (question.type === "single" || question.type === "multi") {
    const multi = question.type === "multi";
    const selected = multi ? ((value as number[] | null) ?? []) : value;
    return (
      <div className="flex flex-col gap-2" role={multi ? "group" : "radiogroup"}>
        {multi && <p className="text-xs text-muted-foreground">{t.multiHint}</p>}
        {question.options.map((option, index) => {
          const checked = multi ? (selected as number[]).includes(index) : selected === index;
          return (
            <label
              key={index}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                checked ? "border-[var(--chart-accent)] bg-[color-mix(in_srgb,var(--chart-accent)_10%,transparent)]" : "hover:bg-accent",
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={question.id}
                className="mt-0.5 size-4 shrink-0 accent-[var(--chart-accent)]"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  if (!multi) return onChange(index);
                  const list = selected as number[];
                  onChange(checked ? list.filter((x) => x !== index) : [...list, index].sort((a, b) => a - b));
                }}
              />
              <span className="whitespace-pre-line" dir="auto">{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <input
      className={controlClass}
      inputMode={question.type === "numeric" ? "decimal" : "text"}
      autoComplete="off"
      dir="auto"
      placeholder={question.type === "numeric" ? t.numericPlaceholder : t.textPlaceholder}
      value={(value as string | null) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}

function Countdown({ endsAt, onElapsed }: { endsAt: number; onElapsed: () => void }) {
  const { dict } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, endsAt - now);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onElapsed();
    }
  }, [left, onElapsed]);

  const minutes = Math.floor(left / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  const low = left < 60_000;

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold tabular-nums",
        low ? "bg-destructive/15 text-destructive dark:text-red-400" : "bg-muted",
      )}
      aria-label={dict.quiz.timeLeft}
      role="timer"
    >
      <Clock size={14} />
      {left === 0 ? dict.quiz.timeUp : `${minutes}:${String(seconds).padStart(2, "0")}`}
    </span>
  );
}
