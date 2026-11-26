"use client";

import { Moon, Pause, Play, RotateCcw } from "lucide-react";
import { format, type FocusTimer, type TimerMode } from "@/components/dashboard/use-focus-timer";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Big time with a thin progress ring and a soft lamp-like glow behind it. */
export function TimerFace({ timer, size = 200 }: { timer: FocusTimer; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = 1 - timer.remaining / timer.total;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* warm glow, a little brighter while running */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-[12%] rounded-full blur-3xl transition-opacity duration-700",
          timer.running ? "opacity-100" : "opacity-60",
        )}
        style={{ background: "radial-gradient(circle, rgb(201 164 106 / 0.22), transparent 70%)" }}
      />
      <svg width={size} height={size} className="absolute -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={timer.mode === "focus" ? "var(--c-amber)" : "var(--c-sage)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done)}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      <span
        className="relative font-display font-medium tabular-nums"
        style={{ fontSize: size * 0.24 }}
        role="timer"
        aria-live="off"
      >
        {timer.ready ? format(timer.remaining) : "--:--"}
      </span>
    </div>
  );
}

export function TimerControls({ timer, className }: { timer: FocusTimer; className?: string }) {
  const { dict } = useI18n();
  const t = dict.dash;
  const atStart = !timer.running && timer.remaining === timer.total;
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <button
        type="button"
        onClick={timer.running ? timer.pause : timer.start}
        className="press inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {timer.running ? <Pause size={16} /> : <Play size={16} />}
        {timer.running ? t.pause : atStart ? t.start : t.resume}
      </button>
      <button
        type="button"
        onClick={timer.reset}
        disabled={atStart}
        aria-label={t.reset}
        title={t.reset}
        className="press inline-flex size-10 items-center justify-center rounded-lg border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}

export function TimerCard({
  timer,
  sessionsToday,
  onFocusMode,
}: {
  timer: FocusTimer;
  sessionsToday: number;
  onFocusMode: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.dash;
  return (
    <section className="soft flex flex-col rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{t.timer}</h2>
        <div className="flex rounded-lg border p-0.5 text-sm" role="group">
          {(["focus", "break"] as TimerMode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={timer.mode === m}
              onClick={() => timer.setMode(m)}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors duration-200",
                timer.mode === m ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "focus" ? t.focus : t.break}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <TimerFace timer={timer} />
      </div>

      <TimerControls timer={timer} />

      <div className="mt-5 flex items-center justify-between gap-2 border-t pt-4 text-sm">
        <span className="text-[var(--c-sage)]">
          {sessionsToday === 0 ? (
            <span className="text-muted-foreground">{t.noSessions}</span>
          ) : sessionsToday === 1 ? (
            t.oneSession
          ) : (
            fill(t.sessions, { n: sessionsToday })
          )}
        </span>
        <button
          type="button"
          onClick={onFocusMode}
          className="press inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Moon size={15} />
          {t.focusMode}
        </button>
      </div>
    </section>
  );
}
