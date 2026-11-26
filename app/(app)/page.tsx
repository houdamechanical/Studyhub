"use client";

import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { ProgressCard, StreakCard, TasksCard } from "@/components/dashboard/cards";
import { FocusMode } from "@/components/dashboard/focus-mode";
import { TimerCard } from "@/components/dashboard/timer-card";
import { useFocusTimer } from "@/components/dashboard/use-focus-timer";
import { SubjectIcon } from "@/components/subject-icon";
import { localDay, loadStudyDays, loadTasks, readFocusLog, streakLength, subjectProgress, type Task } from "@/lib/dashboard";
import { useLoad } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { daysUntil, loadPractice, loadUpcomingExams } from "@/lib/loaders";
import { setTaskDone } from "@/lib/mutations/tasks";
import { SUBJECTS } from "@/lib/subjects";

async function loadDashboard(today: string) {
  const [tasks, days, practice, exams] = await Promise.all([
    loadTasks(today),
    loadStudyDays(),
    loadPractice(),
    loadUpcomingExams(),
  ]);
  return { ...tasks, days, progress: subjectProgress(practice.quizList, practice.deckList, today), exam: exams[0] ?? null };
}

export default function Dashboard() {
  const { nickname } = useAuth();
  const { locale, dict } = useI18n();
  useTitle(dict.nav.home);

  // "Today" is the browser's local day.
  const [today, setToday] = useState(() => localDay(Date.now()));
  useEffect(() => setToday(localDay(Date.now())), []);
  const { data } = useLoad(() => loadDashboard(today), `dashboard:${today}`);

  const [sessions, setSessions] = useState(0);
  const refreshSessions = useCallback(() => setSessions(readFocusLog()[localDay(Date.now())] ?? 0), []);
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


  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-10">
      <header className="enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground">{dict.home.welcome}</p>
          <h1 className="mt-1 font-display text-4xl font-medium sm:text-5xl">
            <bdi>{nickname || "…"}</bdi>
          </h1>
        </div>
        {data?.exam && (
          <Link
            href="/grades?tab=exams"
            className="press inline-flex max-w-full items-center gap-2.5 rounded-lg border bg-card px-3.5 py-2 text-sm hover:bg-secondary"
          >
            <CalendarClock size={16} className="shrink-0 text-[var(--c-slate)]" />
            <SubjectIcon subject={data.exam.subject} className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{data.exam.title || SUBJECTS[data.exam.subject].label[locale]}</span>
            <span className="shrink-0 text-muted-foreground">
              {formatDate(data.exam.exam_date, locale, { day: "numeric", month: "short" })}
            </span>
            <span className="shrink-0 font-medium text-primary">{whenLabel(data.exam.exam_date, dict)}</span>
            <ChevronRight size={15} className="shrink-0 text-muted-foreground rtl:rotate-180" />
          </Link>
        )}
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 lg:grid-cols-5 lg:gap-5">
        <div className="enter lg:col-span-2 [animation-delay:60ms]">
          <TimerCard timer={timer} sessionsToday={sessions} onFocusMode={() => setFocusOpen(true)} />
        </div>
        <div className="enter lg:col-span-3 [animation-delay:120ms]">
          <TasksCard tasks={data?.tasks ?? null} missing={data?.missing ?? false} today={today} currentId={focusOpen ? current?.id ?? null : null} onFocus={focusOn} />
        </div>
        <div className="enter lg:col-span-2 [animation-delay:180ms]">
          <StreakCard days={data?.days ?? null} streak={data ? streakLength(data.days, today) : 0} today={today} />
        </div>
        <div className="enter lg:col-span-3 [animation-delay:240ms]">
          <ProgressCard rows={data?.progress ?? null} />
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
