"use client";

import { ChevronRight, Layers, ListChecks, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import type { QuizKind } from "@/lib/practice";
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export type QuizSummary = {
  id: string;
  kind: QuizKind;
  subject: SubjectId;
  topic: string;
  title: string;
  durationMinutes: number | null;
  questionCount: number;
  best: number | null; // 0–1
  attempts: number;
};

export type DeckSummary = {
  id: string;
  subject: SubjectId;
  topic: string;
  title: string;
  cardCount: number;
  dueDates: (string | null)[];
};

export function PracticeHub({ quizzes, decks }: { quizzes: QuizSummary[]; decks: DeckSummary[] }) {
  const { locale, dict } = useI18n();
  const t = dict.practice;
  const [subject, setSubject] = useState<SubjectId | "all">("all");
  // Due cards depend on the browser's date.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);

  const used = SUBJECT_IDS.filter((id) => quizzes.some((q) => q.subject === id) || decks.some((d) => d.subject === id));
  const bySubject = <T extends { subject: SubjectId }>(list: T[]) =>
    subject === "all" ? list : list.filter((x) => x.subject === subject);
  const mocks = bySubject(quizzes.filter((q) => q.kind === "mock"));
  const minis = bySubject(quizzes.filter((q) => q.kind === "mini"));
  const shownDecks = bySubject(decks);

  if (quizzes.length === 0 && decks.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{t.emptyAll}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-1.5" role="group">
        {(["all", ...used] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubject(id)}
            aria-pressed={subject === id}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              subject === id ? "border-foreground bg-foreground text-background" : "hover:bg-accent",
            )}
          >
            {id === "all" ? t.all : `${SUBJECTS[id].emoji} ${SUBJECTS[id].label[locale]}`}
          </button>
        ))}
      </div>

      <Section title={t.mockExams} icon={<Timer size={16} />} empty={mocks.length === 0}>
        {mocks.map((q) => (
          <QuizRow key={q.id} quiz={q} />
        ))}
      </Section>

      <Section title={t.miniTests} icon={<ListChecks size={16} />} empty={minis.length === 0}>
        {minis.map((q) => (
          <QuizRow key={q.id} quiz={q} />
        ))}
      </Section>

      <Section title={t.flashcards} icon={<Layers size={16} />} empty={shownDecks.length === 0}>
        {shownDecks.map((d) => {
          const due = today === null ? null : d.dueDates.filter((x) => x === null || x <= today).length;
          return (
            <Row
              key={d.id}
              href={`/practice/deck?id=${d.id}`}
              subject={d.subject}
              title={d.title}
              meta={[d.cardCount === 1 ? t.oneCard : fill(t.cards, { n: d.cardCount }), d.topic]}
              badge={
                due === null ? null : due > 0 ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--chart-accent)_18%,transparent)] px-2 py-0.5 text-xs font-medium text-foreground">
                    {fill(t.due, { n: due })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t.nothingDue}</span>
                )
              }
            />
          );
        })}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: boolean;
  children: React.ReactNode;
}) {
  const { dict } = useI18n();
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>
      {empty ? (
        <p className="text-sm text-muted-foreground">{dict.practice.noneYet}</p>
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}
    </section>
  );
}

function QuizRow({ quiz }: { quiz: QuizSummary }) {
  const { dict } = useI18n();
  const t = dict.practice;
  return (
    <Row
      href={`/practice/quiz?id=${quiz.id}`}
      subject={quiz.subject}
      title={quiz.title}
      meta={[
        quiz.questionCount === 1 ? t.oneQuestion : fill(t.questions, { n: quiz.questionCount }),
        quiz.durationMinutes ? fill(t.minutes, { n: quiz.durationMinutes }) : "",
        quiz.topic,
      ]}
      badge={
        quiz.best !== null ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {fill(t.best, { score: `${Math.round(quiz.best * 100)} %` })} · {fill(t.attempts, { n: quiz.attempts })}
          </span>
        ) : null
      }
    />
  );
}

function Row({
  href,
  subject,
  title,
  meta,
  badge,
}: {
  href: string;
  subject: SubjectId;
  title: string;
  meta: string[];
  badge: React.ReactNode;
}) {
  const { locale } = useI18n();
  const info = SUBJECTS[subject];
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent">
        <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: info.color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug" dir="auto">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[`${info.emoji} ${info.label[locale]}`, ...meta.filter(Boolean)].join(" · ")}
          </p>
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>
        <ChevronRight size={18} className="shrink-0 text-muted-foreground rtl:rotate-180" />
      </Link>
    </li>
  );
}
