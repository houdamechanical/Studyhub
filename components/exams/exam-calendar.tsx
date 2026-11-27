"use client";

import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { formatPeriods, type SchoolExam } from "@/lib/exams";
import { formatDate, intlLocale, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

type Month = { y: number; m: number }; // m: 0–11

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthOf = (date: string): Month => ({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });
const addMonths = ({ y, m }: Month, n: number): Month => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 });
const key = ({ y, m }: Month) => y * 12 + m;

/** Weeks of a month, Monday first; null = padding day. */
function weeks({ y, m }: Month) {
  const first = (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

function useWeekdays(style: "narrow" | "short") {
  const { locale } = useI18n();
  return useMemo(() => {
    const f = new Intl.DateTimeFormat(intlLocale(locale), { weekday: style });
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i))); // 1 Jan 2024 = Monday
  }, [locale, style]);
}

function byDate(exams: SchoolExam[]) {
  const map = new Map<string, SchoolExam[]>();
  for (const e of exams) map.set(e.exam_date, [...(map.get(e.exam_date) ?? []), e]);
  return map;
}

/** Small month on the home screen; the whole card opens the full calendar. */
export function MiniCalendar({ exams, onOpen }: { exams: SchoolExam[]; onOpen: () => void }) {
  const { locale, dict } = useI18n();
  const wd = useWeekdays("narrow");
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  if (!today) return <div className="h-full min-h-48 animate-pulse rounded-xl border bg-card shadow-card" aria-hidden />;

  const month = monthOf(today);
  const map = byDate(exams);
  const count = exams.filter((e) => key(monthOf(e.exam_date)) === key(month)).length;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={dict.home.openCalendar}
      className="enter group flex h-full w-full flex-col rounded-xl border bg-card shadow-card text-start transition-colors hover:border-[var(--c-border-strong)]"
    >
      <span className="flex w-full items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-medium text-muted-foreground">{dict.home.calendar}</span>
        <ChevronRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
      </span>
      <span className="flex w-full flex-1 flex-col px-4 py-3">
        <span className="flex items-baseline justify-between">
          <span className="font-semibold">
            {new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(new Date(month.y, month.m, 1))}
          </span>
          <span className="text-xs text-muted-foreground">
            {count === 0 ? dict.home.noExamsMonth : count === 1 ? dict.home.oneExamThisMonth : fill(dict.home.examsThisMonth, { n: count })}
          </span>
        </span>
        <span className="mt-2 grid grid-cols-7 gap-y-0.5 text-center text-xs">
          {wd.map((d, i) => (
            <span key={i} className="pb-1 text-muted-foreground">
              {d}
            </span>
          ))}
          {weeks(month)
            .flat()
            .map((d, i) => {
              if (d === null) return <span key={i} />;
              const date = iso(month.y, month.m, d);
              const has = map.has(date);
              const isToday = date === today;
              const done = has && date < today;
              return (
                <span key={i} className="flex justify-center py-0.5">
                  <span
                    className={cn(
                      "relative flex size-6 items-center justify-center rounded-md tabular-nums",
                      has && !done && "bg-[color-mix(in_srgb,var(--c-amber)_16%,transparent)] font-semibold text-[var(--c-amber)]",
                      done && "font-semibold text-muted-foreground",
                      isToday && "ring-1 ring-foreground/40",
                      !has && date < today && "text-muted-foreground/60",
                    )}
                  >
                    {d}
                    {done && <PastMark />}
                  </span>
                </span>
              );
            })}
        </span>
      </span>
    </button>
  );
}

/** Hand-drawn style cross over a day whose exam is already written. */
function PastMark() {
  return <X className="pointer-events-none absolute inset-0 m-auto size-6 text-foreground/75" strokeWidth={2.25} aria-hidden />;
}

/** Full calendar in a dialog: month by month, every exam on its day, and the month's list below. */
export function CalendarDialog({ exams, onClose }: { exams: SchoolExam[]; onClose: () => void }) {
  const { locale, dict } = useI18n();
  const t = dict.home;
  const wd = useWeekdays("short");
  const today = todayISO();
  const map = useMemo(() => byDate(exams), [exams]);
  // Months that have exams, plus today's month.
  const range = useMemo(() => {
    const ks = [...exams.map((e) => key(monthOf(e.exam_date))), key(monthOf(today))];
    return { min: Math.min(...ks), max: Math.max(...ks) };
  }, [exams, today]);
  const [month, setMonth] = useState<Month>(monthOf(today));
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setMonth((m) => (key(m) > range.min ? addMonths(m, -1) : m));
      if (e.key === "ArrowRight") setMonth((m) => (key(m) < range.max ? addMonths(m, 1) : m));
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, range]);

  const inMonth = exams
    .filter((e) => key(monthOf(e.exam_date)) === key(month))
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const list = picked ? inMonth.filter((e) => e.exam_date === picked) : inMonth;
  const title = new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(new Date(month.y, month.m, 1));
  const step = (n: number) => {
    setPicked(null);
    setMonth((m) => addMonths(m, n));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="cal-title">
      <button type="button" aria-hidden tabIndex={-1} onClick={onClose} className="dialog-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="dialog-panel relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border bg-popover shadow-2xl sm:rounded-xl">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <h2 id="cal-title" className="flex-1 font-semibold">
            {t.calendar}
          </h2>
          <button type="button" onClick={onClose} aria-label={dict.quiz.close} className="press flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto">
          <div className="flex items-center justify-between px-4 pt-4">
            <button type="button" onClick={() => step(-1)} disabled={key(month) <= range.min} aria-label={t.prevMonth} className="press flex size-9 items-center justify-center rounded-lg border disabled:opacity-30">
              <ChevronLeft size={17} className="rtl:rotate-180" />
            </button>
            <p className="text-lg font-semibold" aria-live="polite">
              {title}
            </p>
            <button type="button" onClick={() => step(1)} disabled={key(month) >= range.max} aria-label={t.nextMonth} className="press flex size-9 items-center justify-center rounded-lg border disabled:opacity-30">
              <ChevronRight size={17} className="rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-3 pt-3 sm:px-4">
            {wd.map((d) => (
              <span key={d} className="pb-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {d}
              </span>
            ))}
            {weeks(month)
              .flat()
              .map((d, i) => {
                if (d === null) return <span key={i} />;
                const date = iso(month.y, month.m, d);
                const day = map.get(date) ?? [];
                const past = date < today;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={day.length === 0}
                    onClick={() => setPicked((p) => (p === date ? null : date))}
                    aria-pressed={picked === date}
                    aria-label={day.length ? `${formatDate(date, locale)}: ${day.map((e) => SUBJECTS[e.subject].label[locale]).join(", ")}${past ? ` (${t.pastExam})` : ""}` : undefined}
                    className={cn(
                      "flex min-h-14 flex-col items-stretch gap-0.5 rounded-lg border p-1 text-start sm:min-h-20 sm:p-1.5",
                      day.length ? "bg-card hover:border-[var(--c-border-strong)]" : "border-transparent",
                      picked === date && "border-[var(--c-amber)]",
                      past && day.length === 0 && "opacity-55",
                    )}
                  >
                    <span className={cn("text-xs tabular-nums", date === today ? "font-bold text-[var(--c-amber)]" : "text-muted-foreground")}>{d}</span>
                    {day.map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs font-medium",
                          past ? "bg-secondary text-muted-foreground" : "bg-[color-mix(in_srgb,var(--c-amber)_14%,transparent)] text-[var(--c-amber)]",
                        )}
                      >
                        {past ? <X className="size-3 shrink-0 text-foreground" strokeWidth={3} aria-hidden /> : <SubjectIcon subject={e.subject} className="size-3 shrink-0" />}
                        <span className={cn("hidden truncate sm:inline", past && "line-through")}>{SUBJECTS[e.subject].label[locale]}</span>
                      </span>
                    ))}
                  </button>
                );
              })}
          </div>

          <ul className="m-4 divide-y rounded-xl border bg-card shadow-card">
            {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t.noExamsMonth}</li>}
            {list.map((e) => (
              <li key={e.id} className={cn("flex items-center gap-3 px-4 py-2.5 text-sm", e.exam_date < today && "text-muted-foreground")}>
                {e.exam_date < today ? (
                  <span className="flex size-4 shrink-0 items-center justify-center" title={t.pastExam}>
                    <X className="size-4 text-foreground" strokeWidth={3} aria-label={t.pastExam} />
                  </span>
                ) : (
                  <SubjectIcon subject={e.subject} className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("min-w-0 flex-1 truncate font-medium", e.exam_date < today && "line-through decoration-foreground/50")}>
                  {SUBJECTS[e.subject].label[locale]}
                  {e.title && <span className="font-normal text-muted-foreground"> · {e.title}</span>}
                </span>
                {e.periods && (
                  <span className="hidden items-center gap-1 text-muted-foreground sm:flex">
                    <Clock size={13} aria-hidden />
                    {formatPeriods(e.periods)}
                  </span>
                )}
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatDate(e.exam_date, locale, { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
