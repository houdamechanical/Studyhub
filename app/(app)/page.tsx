"use client";

import { CalendarClock, ChevronRight, Moon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { AwardsSection } from "@/components/dashboard/awards";
import { ProgressCard, StreakCard, TasksCard } from "@/components/dashboard/cards";
import { FocusMode } from "@/components/dashboard/focus-mode";
import { TimerControls, TimerFace } from "@/components/dashboard/timer-card";
import { useFocusTimer, type TimerMode } from "@/components/dashboard/use-focus-timer";
import { SubjectIcon } from "@/components/subject-icon";
import { computeAwards } from "@/lib/awards";
import {
  localDay,
  loadStudyDays,
  loadTasks,
  longestStreak,
  readFocusLog,
  streakLength,
  subjectProgress,
  type Task,
} from "@/lib/dashboard";
import { useLoad } from "@/lib/data";
import { formatDate, intlLocale } from "@/lib/format";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { daysUntil, loadPractice, loadUpcomingExams } from "@/lib/loaders";
import { setTaskDone } from "@/lib/mutations/tasks";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

async function loadDashboard(today: string) {
  const [tasks, study, practice, exams] = await Promise.all([
    loadTasks(today),
    loadStudyDays(),
    loadPractice(),
    loadUpcomingExams(),
  ]);
  return {
    ...tasks,
    days: study.days,
    tasksDone: study.tasksDone,
    quizzes: practice.quizList,
    decks: practice.deckList,
    progress: subjectProgress(practice.quizList, practice.deckList, today),
    exam: exams[0] ?? null,
  };
}

export default function Dashboard() {
  const { nickname } = useAuth();
  const { locale, dict } = useI18n();
  const t = dict.dash;
  useTitle(dict.nav.home);

  // "Today" and the greeting follow the browser's clock.
  const [today, setToday] = useState(() => localDay(Date.now()));
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setToday(localDay(Date.now()));
    setHour(new Date().getHours());
  }, []);
  const { data } = useLoad(() => loadDashboard(today), `dashboard:${today}`);

  const [sessions, setSessions] = useState(0);
  const [focusTotal, setFocusTotal] = useState(0);
  const refreshSessions = useCallback(() => {
    const log = readFocusLog();
    setSessions(log[localDay(Date.now())] ?? 0);
    setFocusTotal(Object.values(log).reduce((s, n) => s + n, 0));
  }, []);
  useEffect(refreshSessions, [refreshSessions]);
  const timer = useFocusTimer(refreshSessions);

  const [focusOpen, setFocusOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const openTasks = data?.tasks.filter((x) => !x.done_at) ?? [];
  const current = openTasks.find((x) => x.id === currentId) ?? openTasks[0] ?? null;
  function focusOn(task: Task) {
    setCurrentId(task.id);
    setFocusOpen(true);
  }
  const closeFocus = useCallback(() => setFocusOpen(false), []);

  const greeting =
    hour === null ? dict.home.welcome : hour < 5 ? t.night : hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;
  const dateLabel = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${today}T12:00:00`),
  );
  const awards = data
    ? computeAwards({
        quizzes: data.quizzes,
        decks: data.decks,
        longestStreak: longestStreak(data.days),
        focusSessions: focusTotal,
        tasksDone: data.tasksDone,
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-12">
      {/* Greeting */}
      <header className="enter">
        <p className="eyebrow">
          {greeting} · {dateLabel}
        </p>
        <h1 className="mt-3 font-display text-5xl font-normal leading-[1.05] sm:text-6xl">
          <bdi>{nickname || "…"}</bdi>
        </h1>
      </header>

      {/* Hero: the timer in a softly breathing warm light */}
      <section className="enter relative isolate mt-10 flex flex-col items-center py-6 [animation-delay:80ms] sm:mt-12">
        <div aria-hidden className="glow-orb pointer-events-none absolute inset-0 -z-10 m-auto size-[340px] sm:size-[460px]" />
        <div className="flex gap-5" role="group">
          {(["focus", "break"] as TimerMode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={timer.mode === m}
              onClick={() => timer.setMode(m)}
              className={cn(
                "eyebrow border-b pb-1 transition-colors duration-300",
                timer.mode === m ? "border-[var(--c-amber)] !text-foreground" : "border-transparent hover:!text-foreground",
              )}
            >
              {m === "focus" ? t.focus : t.break}
            </button>
          ))}
        </div>
        <div className="my-6">
          <TimerFace timer={timer} size={248} />
        </div>
        <TimerControls timer={timer} />
        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
          <span className={sessions > 0 ? "text-[var(--c-sage)]" : undefined}>
            {sessions === 0 ? t.noSessions : sessions === 1 ? t.oneSession : fill(t.sessions, { n: sessions })}
          </span>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => setFocusOpen(true)}
            className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground"
          >
            <Moon size={14} />
            {t.focusMode}
          </button>
        </div>
      </section>

      {data?.exam && (
        <Link
          href="/grades?tab=exams"
          className="enter group mt-8 flex items-center gap-3 border-y py-4 text-sm [animation-delay:140ms]"
        >
          <CalendarClock size={16} className="shrink-0 text-[var(--c-slate)]" />
          <span className="eyebrow shrink-0">{dict.home.nextExam}</span>
          <SubjectIcon subject={data.exam.subject} className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{data.exam.title || SUBJECTS[data.exam.subject].label[locale]}</span>
          <span className="hidden shrink-0 text-muted-foreground sm:inline">
            {formatDate(data.exam.exam_date, locale, { day: "numeric", month: "short" })}
          </span>
          <span className="shrink-0 text-primary">{whenLabel(data.exam.exam_date, dict)}</span>
          <ChevronRight size={15} className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      )}

      <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-2">
        <div className="enter [animation-delay:180ms]">
          <TasksCard
            tasks={data?.tasks ?? null}
            missing={data?.missing ?? false}
            today={today}
            currentId={focusOpen ? current?.id ?? null : null}
            onFocus={focusOn}
          />
        </div>
        <div className="enter [animation-delay:220ms]">
          <ProgressCard rows={data?.progress ?? null} />
        </div>
        <div className="enter [animation-delay:260ms]">
          <StreakCard days={data?.days ?? null} streak={data ? streakLength(data.days, today) : 0} today={today} />
        </div>
        <div className="enter lg:col-span-2 [animation-delay:300ms]">
          <AwardsSection awards={awards} />
        </div>
      </div>

      {focusOpen && (
        <FocusMode
          timer={timer}
          task={current}
          onClose={closeFocus}
          onDone={async () => {
            if (current) await setTaskDone(current.id, true);
            setCurrentId(null);
          }}
        />
      )}
    </div>
  );
}

function whenLabel(date: string, dict: ReturnType<typeof useI18n>["dict"]) {
  const days = daysUntil(date);
  return days <= 0 ? dict.home.today : days === 1 ? dict.home.tomorrow : fill(dict.home.inDays, { n: days });
}
