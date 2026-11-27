"use client";

import { dueCount, type DeckSummary, type QuizSummary } from "@/lib/loaders";
import { SUBJECT_IDS, type SubjectId } from "@/lib/subjects";

export type SubjectProgress = {
  subject: SubjectId;
  /** 0–1: half tests taken, half flashcards learned (or all of one if the other is missing). */
  progress: number;
  testsTaken: number;
  tests: number;
  avgBest: number | null;
  cardsLearned: number;
  cards: number;
  due: number;
};

export function subjectProgress(quizzes: QuizSummary[], decks: DeckSummary[], today: string): SubjectProgress[] {
  return SUBJECT_IDS.flatMap((subject) => {
    const qs = quizzes.filter((q) => q.subject === subject);
    const ds = decks.filter((d) => d.subject === subject);
    const cards = ds.reduce((s, d) => s + d.cardCount, 0);
    if (qs.length === 0 && cards === 0) return [];
    const taken = qs.filter((q) => q.best !== null);
    const learned = ds.reduce((s, d) => s + d.dueDates.filter((x) => x !== null).length, 0);
    const parts = [qs.length ? taken.length / qs.length : null, cards ? learned / cards : null].filter(
      (x): x is number => x !== null,
    );
    return [
      {
        subject,
        progress: parts.reduce((s, x) => s + x, 0) / parts.length,
        testsTaken: taken.length,
        tests: qs.length,
        avgBest: taken.length ? taken.reduce((s, q) => s + (q.best ?? 0), 0) / taken.length : null,
        cardsLearned: learned,
        cards,
        due: ds.reduce((s, d) => s + dueCount(d, today), 0),
      },
    ];
  });
}
