"use client";

import { ArrowLeft, ArrowRight, Clock, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startAttempt, submitAttempt } from "@/lib/mutations/practice";
import { Button } from "@/components/ui/button";
import { controlClass, FormError } from "@/components/ui/field";
import { intlLocale } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import type { GivenAnswer, Question, Quiz } from "@/lib/practice";
import { subjectHref } from "@/lib/school";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

type PastAttempt = { id: string; score: number; maxScore: number; submittedAt: string; overTime: boolean };
type Phase = "intro" | "running" | "submitting";

export function QuizRunner({
  quiz,
  questions: pool,
  attempts,
}: {
  quiz: Quiz;
  /** All of the quiz's questions; a random mini test shows only the ones drawn for the attempt. */
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
  const [drawn, setDrawn] = useState<string[] | null>(null);
  const questions = useMemo(() => {
    if (!drawn) return pool;
    const byId = new Map(pool.map((q) => [q.id, q]));
    return drawn.map((id) => byId.get(id)).filter((q): q is Question => q !== undefined);
  }, [drawn, pool]);
  const questionCount = quiz.draw_count ?? pool.length;

  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const [index, setIndex] = useState(0);
  function go(i: number) {
    setIndex(Math.max(0, Math.min(questions.length - 1, i)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function start() {
    setError(null);
    const result = await startAttempt(quiz.id, timed);
    if (!result.ok) return setError(dict.common.error[result.error]);
    setAttemptId(result.attemptId);
    setDrawn(result.questionIds);
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
        router.push(`/practice/attempt?id=${result.attemptId}&done=1`);
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
        <Link href={subjectHref(quiz.subject) + (quiz.kind === "mock" ? "#mock" : "#mini")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t.backToPractice}
        </Link>
        <section className="relative isolate py-8 text-center sm:py-12">
          <div aria-hidden className="glow-orb pointer-events-none absolute inset-0 -z-10 m-auto size-[320px] sm:size-[420px]" />
          <p className="eyebrow">
            {quiz.kind === "mock" ? t.mock : t.mini} · {subject.label[locale]}
          </p>
          <h1 className="mx-auto mt-4 max-w-xl font-display text-4xl font-normal leading-tight sm:text-5xl" dir="auto">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-muted-foreground" dir="auto">
              {quiz.description}
            </p>
          )}
          <p className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-6 border-y py-4 font-display text-xl">
            <span>{fill(dict.practice.questions, { n: questionCount })}</span>
            {quiz.duration_minutes && (
              <>
                <span className="h-5 w-px bg-border" aria-hidden />
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
                  {fill(dict.practice.minutes, { n: quiz.duration_minutes })}
                </span>
              </>
            )}
          </p>

          {quiz.duration_minutes && (
            <label className="mx-auto mt-6 flex max-w-sm cursor-pointer items-start gap-3 text-start text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-[var(--c-amber)]"
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
          <Button className="mt-8 h-12 min-w-44 rounded-lg text-base" onClick={start} disabled={pool.length === 0}>
            <Play size={16} />
            {t.start}
          </Button>
        </section>

        {attempts.length > 0 && (
          <section>
            <h2 className="eyebrow mb-3">{t.previousAttempts}</h2>
            <ul className="divide-y rounded-xl border bg-card">
              {attempts.map((a) => (
                <li key={a.id}>
                  <Link href={`/practice/attempt?id=${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors duration-200 hover:bg-secondary">
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

  const q = questions[Math.min(index, Math.max(0, questions.length - 1))];
  const last = index >= questions.length - 1;
  const busy = phase === "submitting";

  return (
    <div className="flex flex-col">
      {/* Status bar + thin progress line */}
      <div className="sticky top-14 z-30 -mx-4 bg-background/90 px-4 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 py-3">
          {endsAt && <Countdown endsAt={endsAt} onElapsed={() => submit(true)} />}
          <span className="eyebrow">{fill(t.questionOf, { n: index + 1, total: questions.length })}</span>
          <span className="ms-auto text-sm tabular-nums text-muted-foreground">
            {fill(t.answered, { a: answeredCount, n: questions.length })}
          </span>
        </div>
        <div className="h-px bg-border">
          <div
            className="h-px bg-[var(--c-amber)] transition-[width] duration-300 ease-out"
            style={{ width: `${((index + 1) / Math.max(1, questions.length)) * 100}%` }}
          />
        </div>
      </div>

      <FormError message={error} />

      {q && (
        <div key={q.id} className="enter py-10 sm:py-14">
          <p className="eyebrow flex justify-between">
            <span>{fill(t.question, { n: index + 1 })}</span>
            <span>{fill(t.pointsShort, { n: q.points })}</span>
          </p>
          <p className="mt-4 max-w-[65ch] whitespace-pre-line font-display text-2xl font-normal leading-snug sm:text-[1.7rem]" dir="auto">
            {q.prompt}
          </p>
          <div className="mt-8">
            <AnswerInput
              question={q}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              disabled={busy}
            />
          </div>
        </div>
      )}

      {/* Back · question dots · Next / Submit */}
      <div className="hairline flex items-center gap-3 pt-5">
        <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0 || busy} className="rounded-lg">
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t.previous}
        </Button>
        <ol className="flex min-w-0 flex-1 flex-wrap justify-center gap-1.5" aria-label={t.questionOf}>
          {questions.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={fill(t.question, { n: i + 1 })}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "block size-2.5 rounded-full transition-colors duration-200",
                  isAnswered(answers[item.id]) ? "bg-[var(--c-amber)]" : "bg-[#4a443c]",
                  i === index && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background",
                )}
              />
            </li>
          ))}
        </ol>
        {last ? (
          <Button onClick={() => submit()} disabled={busy} className="rounded-lg">
            {busy ? dict.common.saving : t.submit}
          </Button>
        ) : (
          <Button onClick={() => go(index + 1)} disabled={busy} className="rounded-lg">
            {t.next}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Button>
        )}
      </div>
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
      <div className="flex flex-col gap-2.5" role={multi ? "group" : "radiogroup"}>
        {multi && <p className="text-xs text-muted-foreground">{t.multiHint}</p>}
        {question.options.map((option, index) => {
          const checked = multi ? (selected as number[]).includes(index) : selected === index;
          return (
            <label
              key={index}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors duration-200",
                checked ? "border-[var(--c-amber)] bg-[rgb(201_164_106/0.08)]" : "hover:border-[#4a443c] hover:bg-secondary/50",
                disabled && "cursor-default opacity-70",
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={question.id}
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  if (!multi) return onChange(index);
                  const list = selected as number[];
                  onChange(checked ? list.filter((x) => x !== index) : [...list, index].sort((a, b) => a - b));
                }}
              />
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center border text-xs font-medium transition-colors duration-200",
                  multi ? "rounded-md" : "rounded-full",
                  checked ? "border-transparent bg-[var(--c-amber)] text-[#1c1a17]" : "text-muted-foreground",
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
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
