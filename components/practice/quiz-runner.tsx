"use client";

import { ArrowLeft, ArrowRight, Check, Clock, Play, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startAttempt, submitAttempt } from "@/lib/mutations/practice";
import { SubjectIcon } from "@/components/subject-icon";
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
    const best = attempts.length ? Math.max(...attempts.map((x) => (x.maxScore > 0 ? x.score / x.maxScore : 0))) : null;
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <Breadcrumb
          items={[
            { label: subject.label[locale], href: subjectHref(quiz.subject) },
            { label: quiz.kind === "mock" ? dict.subject.mockExams : dict.subject.miniTests, href: subjectHref(quiz.subject) + (quiz.kind === "mock" ? "#mock" : "#mini") },
          ]}
        />
        <section className="dark-card enter rounded-[28px] p-6 text-white sm:p-8">
          <p className="label-mono flex items-center gap-2 !text-white/55">
            <SubjectIcon subject={quiz.subject} className="size-3.5" strokeWidth={2.2} />
            {quiz.kind === "mock" ? t.mock : t.mini} · {subject.label[locale]}
          </p>
          <h1 className="mt-5 font-display text-[2rem] font-semibold leading-[1.05] tracking-tight [overflow-wrap:anywhere] sm:text-[2.6rem]" dir="auto" lang="de">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="mt-2 text-white/65" dir="auto">
              {quiz.description}
            </p>
          )}
          <dl className="mt-7 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 rtl:divide-x-reverse">
            <Stat label={t.statQuestions} value={String(questionCount)} />
            <Stat label={t.statTime} value={quiz.duration_minutes ? `${quiz.duration_minutes}′` : "–"} />
            <Stat label={t.statBest} value={best === null ? "–" : `${Math.round(best * 100)}%`} accent={best !== null} />
          </dl>

          {quiz.duration_minutes && (
            <label className="mt-5 flex cursor-pointer items-center gap-4">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.timedMode}</span>
                <span className="block text-sm text-white/55">{timed ? t.timedHint : t.untimedHint}</span>
              </span>
              <input type="checkbox" className="peer sr-only" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
              <span
                aria-hidden
                className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition-colors peer-checked:bg-[var(--hero-acc)] peer-focus-visible:ring-2 peer-focus-visible:ring-white/60 after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5"
              />
            </label>
          )}

          <FormError message={error} />
          <button
            type="button"
            onClick={start}
            disabled={pool.length === 0}
            className="press mt-7 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--hero-acc)] text-base font-bold text-[#0e0c0a] disabled:opacity-50"
          >
            <Play size={17} fill="currentColor" />
            {t.start}
            {timed && quiz.duration_minutes ? <span className="font-semibold opacity-70">· {fill(dict.practice.minutes, { n: quiz.duration_minutes })}</span> : null}
          </button>
        </section>

        {attempts.length > 0 && (
          <section>
            <p className="label-mono mb-3">{t.previousAttempts}</p>
            <ul className="flex flex-col gap-2">
              {attempts.map((a) => {
                const pct = a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
                return (
                  <li key={a.id}>
                    <Link href={`/practice/attempt?id=${a.id}`} className="tile press flex items-center gap-4 rounded-2xl px-4 py-3">
                      <span className="w-12 font-display text-xl font-semibold tabular-nums">{pct}%</span>
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--c-border)]">
                        <span className="block h-full rounded-full bg-[var(--c-amber)]" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" }).format(new Date(a.submittedAt))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const q = questions[Math.min(index, Math.max(0, questions.length - 1))];
  const last = index >= questions.length - 1;
  const busy = phase === "submitting";
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      {/* Exit · one segment per question (tap to jump) · timer */}
      <div className="sticky top-14 z-30 -mx-4 bg-background px-4 py-3 md:top-[5.5rem]">
        <div className="flex items-center gap-3">
          <Link
            href={subjectHref(quiz.subject) + (quiz.kind === "mock" ? "#mock" : "#mini")}
            onClick={(e) => {
              if (!confirm(t.leaveWarning)) e.preventDefault();
            }}
            aria-label={t.exit}
            className="press flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"
          >
            <X size={18} />
          </Link>
          <ol className="flex min-w-0 flex-1 gap-1" aria-label={t.questionOf}>
            {questions.map((item, i) => (
              <li key={item.id} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={fill(t.question, { n: i + 1 })}
                  aria-current={i === index ? "step" : undefined}
                  className="flex h-6 w-full items-center"
                >
                  <span
                    className={cn(
                      "block h-1.5 w-full rounded-full transition-colors duration-200",
                      i === index ? "bg-foreground" : isAnswered(answers[item.id]) ? "bg-[var(--c-amber)]" : "bg-[var(--c-border)]",
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
          {endsAt && <Countdown endsAt={endsAt} onElapsed={() => submit(true)} />}
        </div>
      </div>

      <FormError message={error} />

      {q && (
        <div key={q.id} className="enter pb-24 pt-8 sm:pt-12">
          <p className="label-mono flex justify-between">
            <span>
              {pad(index + 1)} / {pad(questions.length)}
            </span>
            <span>{fill(t.pointsShort, { n: q.points })}</span>
          </p>
          <p className="mt-4 whitespace-pre-line font-display text-[1.6rem] font-medium leading-snug tracking-tight sm:text-[1.9rem]" dir="auto">
            {q.prompt}
          </p>
          <div className="mt-8">
            <AnswerInput question={q} value={answers[q.id] ?? null} onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))} disabled={busy} />
          </div>
        </div>
      )}

      {/* Back · Next / Submit – stays in reach of the thumb */}
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-auto bg-gradient-to-t from-background from-60% to-transparent px-4 pb-3 pt-6 md:bottom-0 md:pb-6">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0 || busy}
            aria-label={t.previous}
            className="tile press flex size-14 shrink-0 items-center justify-center rounded-2xl disabled:opacity-40"
          >
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </button>
          {last ? (
            <button type="button" onClick={() => submit()} disabled={busy} className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_12px_28px_-14px_var(--c-amber)]">
              <Check size={19} strokeWidth={2.4} />
              {busy ? dict.common.saving : t.submit}
              <span className="font-medium opacity-75">· {fill(t.answered, { a: answeredCount, n: questions.length })}</span>
            </button>
          ) : (
            <button type="button" onClick={() => go(index + 1)} disabled={busy} className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground text-base font-bold text-background">
              {t.next}
              <ArrowRight size={19} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-3 py-4 first:ps-0">
      <dt className="label-mono !text-[0.62rem] !text-white/45">{label}</dt>
      <dd className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", accent && "text-[var(--hero-acc)]")}>{value}</dd>
    </div>
  );
}

function isAnswered(v: GivenAnswer | undefined) {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

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
        {multi && <p className="label-mono">{t.multiHint}</p>}
        {question.options.map((option, index) => {
          const checked = multi ? (selected as number[]).includes(index) : selected === index;
          return (
            <label
              key={index}
              className={cn(
                "press flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3.5 transition-colors duration-200",
                checked
                  ? "border-[var(--c-amber)] bg-[color-mix(in_srgb,var(--c-amber)_9%,var(--c-bg))] shadow-[0_0_0_1px_var(--c-amber)]"
                  : "tile",
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
                  "label-mono flex size-8 shrink-0 items-center justify-center rounded-lg border !tracking-normal transition-colors duration-200",
                  checked ? "border-transparent bg-[var(--c-amber)] !text-[var(--c-on-amber)]" : "bg-background",
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="whitespace-pre-line font-medium leading-snug" dir="auto">{option}</span>
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
        "flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold tabular-nums",
        low ? "bg-destructive/15 text-destructive dark:text-red-400" : "bg-secondary",
      )}
      aria-label={dict.quiz.timeLeft}
      role="timer"
    >
      <Clock size={14} />
      {left === 0 ? dict.quiz.timeUp : `${minutes}:${String(seconds).padStart(2, "0")}`}
    </span>
  );
}
