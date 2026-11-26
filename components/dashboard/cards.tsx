"use client";

import { Check, Crosshair, Flame, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { shiftDay, type SubjectProgress, type Task } from "@/lib/dashboard";
import { intlLocale } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { addTask, deleteTask, setTaskDone } from "@/lib/mutations/tasks";
import { subjectHref } from "@/lib/school";
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export function Card({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("soft flex flex-col rounded-xl border bg-card p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Today's tasks
// ---------------------------------------------------------------------------

export function TasksCard({
  tasks,
  missing,
  today,
  currentId,
  onFocus,
}: {
  tasks: Task[] | null;
  missing: boolean;
  today: string;
  currentId: string | null;
  onFocus: (task: Task) => void;
}) {
  const { locale, dict } = useI18n();
  const t = dict.dash;
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = (tasks ?? []).filter((x) => !x.done_at);
  const done = (tasks ?? []).filter((x) => x.done_at);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    setError(null);
    start(async () => {
      const r = await addTask(text, today, subject || null);
      if (r.ok) setTitle("");
      else setError(dict.common.error[r.error]);
    });
  }

  const count = tasks ? `${done.length}/${tasks.length}` : "";
  return (
    <Card title={t.tasks} aside={tasks && tasks.length > 0 && <span className="text-sm tabular-nums text-muted-foreground">{count}</span>}>
      {missing ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t.tasksSetup}</p>
      ) : (
        <>
          <form onSubmit={add} className="flex gap-2">
            <label htmlFor="new-task" className="sr-only">
              {t.addPlaceholder}
            </label>
            <input
              id="new-task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.addPlaceholder}
              maxLength={200}
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-[0.95rem] outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary/60"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectId | "")}
              aria-label={dict.grades.subject}
              className="hidden h-10 rounded-lg border bg-background px-2 text-sm text-muted-foreground outline-none focus:border-primary/60 sm:block"
            >
              <option value="">{t.noSubject}</option>
              {SUBJECT_IDS.map((id) => (
                <option key={id} value={id}>
                  {SUBJECTS[id].label[locale]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || !title.trim()}
              aria-label={t.add}
              className="press inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          {tasks === null ? (
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">{t.noTasks}</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {[...open, ...done].map((task) => (
                <TaskRow key={task.id} task={task} current={task.id === currentId} today={today} onFocus={() => onFocus(task)} />
              ))}
            </ul>
          )}
          {tasks && tasks.length > 0 && open.length === 0 && (
            <p className="mt-3 text-sm text-[var(--c-sage)]">{t.allDone}</p>
          )}
        </>
      )}
    </Card>
  );
}

function TaskRow({ task, current, today, onFocus }: { task: Task; current: boolean; today: string; onFocus: () => void }) {
  const { locale, dict } = useI18n();
  const t = dict.dash;
  const [pending, start] = useTransition();
  const done = task.done_at !== null;
  const overdue = !done && task.due_on < today;

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-secondary/60",
        pending && "opacity-60",
        current && "bg-secondary/60",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={task.title}
        onClick={() => start(async () => void (await setTaskDone(task.id, !done)))}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
          done ? "border-[var(--c-sage)] bg-[var(--c-sage)] text-background" : "border-[#5a5247] hover:border-[var(--c-sage)]",
        )}
      >
        {done && <Check size={12} strokeWidth={3} />}
      </button>
      <span className={cn("min-w-0 flex-1 truncate", done && "text-muted-foreground line-through decoration-1")} dir="auto">
        {task.title}
      </span>
      {overdue && <span className="shrink-0 text-xs text-muted-foreground">{shortDate(task.due_on, locale)}</span>}
      {task.subject && (
        <span className="hidden shrink-0 items-center gap-1 rounded-md bg-[rgb(184_138_138/0.12)] px-2 py-0.5 text-xs text-[var(--c-rose)] sm:inline-flex">
          <SubjectIcon subject={task.subject} className="size-3" />
          {SUBJECTS[task.subject].label[locale]}
        </span>
      )}
      {done ? (
        <span className="size-6 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          onClick={onFocus}
          aria-label={t.focusOn}
          title={t.focusOn}
          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-primary focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <Crosshair size={16} />
        </button>
      )}
      <button
        type="button"
        onClick={() => start(async () => void (await deleteTask(task.id)))}
        aria-label={t.deleteTask}
        title={t.deleteTask}
        className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60"
      >
        <X size={16} />
      </button>
    </li>
  );
}

function shortDate(day: string, locale: Parameters<typeof intlLocale>[0]) {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" }).format(new Date(`${day}T12:00:00`));
}

// ---------------------------------------------------------------------------
// Study streak
// ---------------------------------------------------------------------------

export function StreakCard({ days, streak, today }: { days: Set<string> | null; streak: number; today: string }) {
  const { locale, dict } = useI18n();
  const t = dict.dash;
  const week = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  const weekday = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "narrow" });
  return (
    <Card title={t.streak}>
      <div className="flex items-center gap-3">
        <Flame size={28} strokeWidth={1.75} className={streak > 0 ? "text-primary" : "text-muted-foreground"} />
        <div>
          <p className="font-display text-4xl font-medium tabular-nums leading-none">{days ? streak : "–"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {streak === 0 ? t.streakZero : streak === 1 ? t.streakOne : fill(t.streakDays, { n: streak })}
          </p>
        </div>
      </div>
      <ol className="mt-6 grid grid-cols-7 gap-1.5 text-center">
        {week.map((day) => {
          const active = days?.has(day) ?? false;
          return (
            <li key={day} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "size-6 rounded-full border transition-colors duration-300",
                  active ? "border-transparent bg-[var(--c-sage)]" : "bg-transparent",
                  day === today && !active && "border-dashed border-[var(--c-sage)]",
                )}
                aria-label={day}
              />
              <span className={cn("text-xs", day === today ? "text-foreground" : "text-muted-foreground")}>
                {weekday.format(new Date(`${day}T12:00:00`))}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">{t.streakHint}</p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Progress per subject
// ---------------------------------------------------------------------------

export function ProgressCard({ rows }: { rows: SubjectProgress[] | null }) {
  const { locale, dict } = useI18n();
  const t = dict.dash;
  return (
    <Card title={t.progress}>
      {rows === null ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noProgress}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((r) => (
            <li key={r.subject}>
              <Link href={subjectHref(r.subject)} className="block rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-secondary/60">
                <div className="flex items-center gap-2.5">
                  <SubjectIcon subject={r.subject} className="size-4 text-muted-foreground" />
                  <span className="flex-1 font-medium">{SUBJECTS[r.subject].label[locale]}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{Math.round(r.progress * 100)} %</span>
                </div>
                <ProgressBar value={r.progress} className="mt-2" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {[
                    r.tests ? fill(t.testsTaken, { a: r.testsTaken, n: r.tests }) : "",
                    r.avgBest !== null ? fill(t.avg, { p: `${Math.round(r.avgBest * 100)} %` }) : "",
                    r.cards ? fill(t.cardsLearned, { a: r.cardsLearned, n: r.cards }) : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{t.progressHint}</p>
    </Card>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-secondary", className)} aria-hidden>
      <div
        className="h-full rounded-full bg-[var(--c-sage)] transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}
