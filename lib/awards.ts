import { Award, BookCheck, Brain, Crown, Flame, Footprints, Layers, ListChecks, Sun, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { DeckSummary, QuizSummary } from "@/lib/loaders";

export type AwardId =
  | "firstTest"
  | "perfect"
  | "streak3"
  | "streak7"
  | "streak30"
  | "cards50"
  | "focus10"
  | "tasks20"
  | "allRounder";

export type AwardState = { id: AwardId; icon: LucideIcon; value: number; target: number; earned: boolean };

export type AwardInput = {
  quizzes: QuizSummary[];
  decks: DeckSummary[];
  /** Longest run of study days ever, so streak awards stay earned. */
  longestStreak: number;
  focusSessions: number;
  tasksDone: number;
};

/**
 * Awards are worked out from what you've already done (nothing extra is
 * stored): tests, flashcards, streaks, focus sessions and finished tasks.
 */
export function computeAwards(x: AwardInput): AwardState[] {
  const taken = x.quizzes.filter((q) => q.best !== null);
  const perfect = taken.filter((q) => (q.best ?? 0) >= 0.9999).length;
  const cards = x.decks.reduce((s, d) => s + d.dueDates.filter((v) => v !== null).length, 0);
  const subjects = new Set(taken.map((q) => q.subject)).size;
  const list: [AwardId, LucideIcon, number, number][] = [
    ["firstTest", Footprints, taken.length, 1],
    ["perfect", Crown, perfect, 1],
    ["streak3", Flame, x.longestStreak, 3],
    ["streak7", Sun, x.longestStreak, 7],
    ["streak30", Award, x.longestStreak, 30],
    ["cards50", Layers, cards, 50],
    ["focus10", Brain, x.focusSessions, 10],
    ["tasks20", ListChecks, x.tasksDone, 20],
    ["allRounder", BookCheck, subjects, 3],
  ];
  return list.map(([id, icon, value, target]) => ({ id, icon, value: Math.min(value, target), target, earned: value >= target }));
}

export function awardText(id: AwardId, dict: Dictionary) {
  return dict.awards[id];
}
