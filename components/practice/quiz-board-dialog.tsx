"use client";

import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { Leaderboard } from "@/components/compare/leaderboard";
import { normaliseBoard, type Board } from "@/lib/compare";
import { must, useLoad } from "@/lib/data";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

/**
 * A test's own leaderboard in a popup – shown right after finishing a mini
 * test (mini tests are not on the Leaderboard page).
 */
export function QuizBoardDialog({ quizId, title, onClose }: { quizId: string; title: string; onClose: () => void }) {
  const { dict } = useI18n();
  const t = dict.compare;
  const state = useLoad(
    async () => normaliseBoard(must(await createClient().rpc("get_quiz_board", { p_quiz_id: quizId })) as Board),
    `quiz-board:${quizId}`,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const board = state.data;
  const me = board?.rows.find((r) => r.is_me);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="board-title">
      <button type="button" aria-label={dict.quiz.close} onClick={onClose} className="dialog-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="dialog-panel relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border bg-card shadow-2xl sm:rounded-xl">
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.leaderboard}</p>
            <h2 id="board-title" className="truncate font-display text-lg font-semibold" dir="auto">
              {title}
            </h2>
            {me && board && (
              <p className="mt-0.5 text-sm font-semibold text-[var(--c-amber)]">
                {me.rank === 1 ? dict.quiz.firstPlace : fill(dict.quiz.yourRank, { rank: me.rank, n: board.participants })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.quiz.close}
            className="press -me-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
          {!board ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : (
            <Leaderboard
              board={board}
              format={(v) => `${Math.round(v * 100)} %`}
              extra={(n) => (n === 1 ? t.oneAttempt : fill(t.attemptsCount, { n }))}
              labels={{ you: t.you, average: t.average, people: t.people, empty: t.noResults }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
