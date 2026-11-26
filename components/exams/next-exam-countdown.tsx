"use client";

import { Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { examStart, sortByDate, type Exam } from "@/lib/exams";
import { formatDate, formatTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { SUBJECTS, subjectGradient } from "@/lib/subjects";

const DAY = 86_400_000;

/** When an exam stops counting as "next": its start, or the end of its day if no time is set. */
function examCutoff(exam: Exam) {
  const start = examStart(exam);
  return exam.start_time ? start.getTime() : start.getTime() + DAY;
}

export function NextExamCountdown({ exams }: { exams: Exam[] }) {
  const { locale, dict } = useI18n();
  const t = dict.exams;
  // "now" only exists in the browser; render a placeholder until mounted.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) {
    return <div className="h-44 animate-pulse rounded-4xl bg-muted" aria-hidden />;
  }

  const next = sortByDate(exams.filter((e) => e.status === "upcoming" && examCutoff(e) > now))[0];

  if (!next) {
    return (
      <div className="rounded-4xl border-2 border-dashed p-8 text-center font-medium text-muted-foreground">
        <span className="mb-2 block text-4xl">🏖️</span>
        {t.noUpcoming}
      </div>
    );
  }

  const subject = SUBJECTS[next.subject];
  const start = examStart(next).getTime();
  const todayStart = new Date(new Date(now).toDateString()).getTime();
  const dayDiff = Math.round((examStart({ ...next, start_time: null }).getTime() - todayStart) / DAY);

  let big: React.ReactNode;
  if (next.start_time) {
    const diff = Math.max(0, start - now);
    const d = Math.floor(diff / DAY);
    const h = Math.floor((diff % DAY) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    big =
      diff < 60_000 ? (
        <p className="font-display text-3xl font-extrabold">{t.startsNow}</p>
      ) : (
        <div className="flex gap-2">
          {[
            [d, t.days],
            [h, t.hours],
            [m, t.minutes],
          ].map(([value, label]) => (
            <div key={label as string} className="glass min-w-20 rounded-2xl px-3 py-2.5 text-center">
              <div className="font-display text-4xl font-extrabold tabular-nums leading-none">{value}</div>
              <div className="mt-1 text-xs font-semibold text-white/85">{label}</div>
            </div>
          ))}
        </div>
      );
  } else {
    big = (
      <p className="font-display text-5xl font-extrabold tracking-tight">
        {dayDiff <= 0 ? t.today : dayDiff === 1 ? t.tomorrow : fill(t.inDays, { n: dayDiff })}
      </p>
    );
  }

  return (
    <section
      aria-label={t.next}
      className="relative isolate overflow-hidden rounded-4xl p-6 text-white shadow-lg sm:p-8"
      style={{ backgroundImage: subjectGradient(next.subject) }}
    >
      <span className="tile-dots absolute inset-0 -z-10 opacity-60" aria-hidden />
      <span
        className="pointer-events-none absolute -bottom-8 -end-4 -z-10 select-none text-[9rem] leading-none opacity-25 motion-safe:animate-float"
        aria-hidden
      >
        {subject.emoji}
      </span>
      <p className="glass inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">{t.next}</p>
      <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
        {subject.emoji} {subject.label[locale]}
        {next.title && <span className="font-semibold text-white/85"> · {next.title}</span>}
      </h2>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-white/85">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {formatDate(next.exam_date, locale, { weekday: "long", day: "numeric", month: "long" })}
          {next.start_time && `, ${formatTime(next.start_time)}`}
        </span>
        {next.room && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {fill(t.roomLabel, { room: next.room })}
          </span>
        )}
      </p>
      <div className="mt-4">{big}</div>
    </section>
  );
}
