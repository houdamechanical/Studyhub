"use client";

import { SubjectIcon } from "@/components/subject-icon";
import { ArrowLeft, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { reviewCard } from "@/lib/mutations/practice";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { RATINGS, type Rating } from "@/lib/practice";
import { subjectHref } from "@/lib/school";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export type StudyCard = { id: string; front: string; back: string; dueOn: string | null };

const RATING_STYLE: Record<Rating, string> = {
  again: "border-red-500/40 hover:bg-red-500/10",
  hard: "border-amber-500/40 hover:bg-amber-500/10",
  good: "border-green-500/40 hover:bg-green-500/10",
  easy: "border-sky-500/40 hover:bg-sky-500/10",
};

export function FlashcardSession({
  deck,
  cards,
}: {
  deck: { id: string; title: string; subject: SubjectId };
  cards: StudyCard[];
}) {
  const { locale, dict } = useI18n();
  const t = dict.cards;
  const subject = SUBJECTS[deck.subject];

  // Build the queue in the browser (needs the local date): due cards first, then new ones.
  const [queue, setQueue] = useState<StudyCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = todayISO();
    const due = cards
      .filter((c) => c.dueOn !== null && c.dueOn <= today)
      .sort((a, b) => a.dueOn!.localeCompare(b.dueOn!));
    const fresh = cards.filter((c) => c.dueOn === null);
    setQueue([...due, ...fresh]);
    setTotal(due.length + fresh.length);
  }, [cards]);

  function practiceAll() {
    setQueue([...cards]);
    setTotal(cards.length);
    setReviewed(0);
  }

  function rate(rating: Rating) {
    if (!queue?.length) return;
    const [card, ...rest] = queue;
    setError(null);
    // "Again" cards come back once more at the end of this session.
    setQueue(rating === "again" ? [...rest, card] : rest);
    if (rating !== "again") setReviewed((n) => n + 1);
    setFlipped(false);
    reviewCard(card.id, rating, todayISO()).then((result) => {
      if (!result.ok) setError(dict.common.error[result.error]);
    });
  }

  // Keyboard: space flips, 1–4 rate.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        rate(RATINGS[Number(e.key) - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const card = queue?.[0];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={subjectHref(deck.subject) + "#cards"} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={dict.quiz.backToPractice}>
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold" dir="auto">{deck.title}</h1>
          <p className="text-xs text-muted-foreground">
            <SubjectIcon subject={deck.subject} className="-mt-0.5 me-1 inline size-[1.05em] align-middle" />{subject.label[locale]}
          </p>
        </div>
        {queue && total > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">{fill(t.progress, { a: Math.min(reviewed, total), n: total })}</span>
        )}
      </div>

      {queue && total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full bg-[var(--chart-accent)] transition-[width] duration-300 ease-out" style={{ width: `${(reviewed / total) * 100}%` }} />
        </div>
      )}

      <FormError message={error} />

      {queue === null ? (
        <div className="h-72 animate-pulse rounded-xl border bg-card shadow-card" aria-hidden />
      ) : !card ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card shadow-card p-8 text-center">
          <PartyPopper size={32} className="text-muted-foreground" />
          {total > 0 ? (
            <>
              <p className="text-lg font-semibold">{t.sessionDone}</p>
              <p className="text-sm text-muted-foreground">{fill(t.sessionSummary, { n: reviewed })}</p>
            </>
          ) : (
            <p className="text-lg font-semibold">{t.nothingDue}</p>
          )}
          <Button variant="outline" onClick={practiceAll} className="mt-2">
            {t.practiceAnyway}
          </Button>
        </div>
      ) : (
        <>
          {/* Flip card */}
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="group relative h-72 w-full [perspective:1200px] sm:h-80"
            aria-label={flipped ? card.back : card.front}
          >
            <div
              className={cn(
                "relative h-full w-full rounded-xl transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none",
                flipped && "[transform:rotateY(180deg)]",
              )}
            >
              <Face>
                <span className="whitespace-pre-line text-xl font-semibold" dir="auto">{card.front}</span>
                <span className="absolute bottom-3 text-xs text-muted-foreground">{t.tapToFlip}</span>
              </Face>
              <Face back>
                <span className="whitespace-pre-line text-base" dir="auto">{card.back}</span>
              </Face>
            </div>
          </button>

          {flipped ? (
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => rate(r)}
                  className={cn("rounded-lg border bg-card px-2 py-3 text-sm font-medium transition-colors", RATING_STYLE[r])}
                >
                  {t[r]}
                  <span className="hidden text-xs text-muted-foreground sm:block">{i + 1}</span>
                </button>
              ))}
            </div>
          ) : (
            <Button size="lg" onClick={() => setFlipped(true)}>
              {t.showAnswer}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function Face({ back = false, children }: { back?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-xl border bg-card p-6 text-center shadow-sm [backface-visibility:hidden]",
        back && "[transform:rotateY(180deg)]",
      )}
    >
      {children}
    </div>
  );
}
