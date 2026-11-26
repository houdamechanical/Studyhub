"use client";

import { SubjectIcon } from "@/components/subject-icon";
import { Clock, MapPin, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { examStart, sortByDate, type Exam } from "@/lib/exams";
import { formatDate, formatTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { SUBJECTS } from "@/lib/subjects";

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
    return <div className="h-40 animate-pulse rounded-xl border bg-card" aria-hidden />;
  }

  const next = sortByDate(exams.filter((e) => e.status === "upcoming" && examCutoff(e) > now))[0];

  if (!next) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Sun className="mx-auto mb-2 size-6 text-muted-foreground" strokeWidth={2} aria-hidden />
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
        <p className="font-display text-2xl font-semibold text-primary">{t.startsNow}</p>
      ) : (
        <div className="flex gap-2">
          {[
            [d, t.days],
            [h, t.hours],
            [m, t.minutes],
          ].map(([value, label]) => (
            <div key={label as string} className="min-w-20 rounded-xl border bg-secondary px-3 py-2.5 text-center">
              <div className="font-display text-3xl font-semibold tabular-nums leading-none">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      );
  } else {
    big = (
      <p className="font-display text-4xl font-semibold text-primary">
        {dayDiff <= 0 ? t.today : dayDiff === 1 ? t.tomorrow : fill(t.inDays, { n: dayDiff })}
      </p>
    );
  }

  return (
    <section
      aria-label={t.next}
      className="rounded-xl border bg-card p-5 sm:p-6"
    >
      <p className="text-sm text-muted-foreground">{t.next}</p>
      <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
        <SubjectIcon subject={next.subject} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />{subject.label[locale]}
        {next.title && <span className="font-medium text-muted-foreground"> · {next.title}</span>}
      </h2>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
