"use client";

import { Check, X } from "lucide-react";
import { useEffect } from "react";
import { TimerControls, TimerFace } from "@/components/dashboard/timer-card";
import type { FocusTimer } from "@/components/dashboard/use-focus-timer";
import type { Task } from "@/lib/dashboard";
import { useI18n } from "@/lib/i18n/client";

/**
 * Focus mode: everything else fades into the dark; only the current task and
 * the timer stay. Escape or the close button leaves it.
 */
export function FocusMode({
  timer,
  task,
  onDone,
  onClose,
}: {
  timer: FocusTimer;
  task: Task | null;
  onDone: () => void;
  onClose: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.dash;

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

  return (
    <div role="dialog" aria-modal="true" aria-label={t.focusMode} className="focus-mode fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#151310]/95 px-6 backdrop-blur-md">
      <button
        type="button"
        onClick={onClose}
        aria-label={t.exitFocus}
        title={t.exitFocus}
        className="press absolute end-4 top-[calc(1rem+env(safe-area-inset-top))] flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <X size={20} />
      </button>

      <div className="flex max-w-xl flex-col items-center text-center">
        <p className="text-sm text-muted-foreground">{task ? t.nowFocusing : t.focusMode}</p>
        <p className="mt-2 font-display text-2xl font-medium leading-snug sm:text-3xl" dir="auto">
          {task ? task.title : t.justTimer}
        </p>
        <div className="my-10">
          <TimerFace timer={timer} size={260} />
        </div>
        <TimerControls timer={timer} />
        {task && (
          <button
            type="button"
            onClick={onDone}
            className="press mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--c-sage)] hover:bg-secondary"
          >
            <Check size={16} />
            {t.markDone}
          </button>
        )}
      </div>
    </div>
  );
}
