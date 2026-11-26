"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logFocusSession } from "@/lib/dashboard";

export type TimerMode = "focus" | "break";
export const DURATION: Record<TimerMode, number> = { focus: 25 * 60_000, break: 5 * 60_000 };

type Saved = { mode: TimerMode; endsAt: number | null; remaining: number };
const KEY = "studyhub:timer";

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    if (s && (s.mode === "focus" || s.mode === "break") && typeof s.remaining === "number") return s;
  } catch {}
  return { mode: "focus", endsAt: null, remaining: DURATION.focus };
}
function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

/**
 * Pomodoro timer (25 min focus / 5 min break). Kept in this browser by its end
 * time, so it keeps running while you move around the app or reload.
 */
export function useFocusTimer(onFinish?: (mode: TimerMode) => void) {
  const [state, setState] = useState<Saved>({ mode: "focus", endsAt: null, remaining: DURATION.focus });
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  const update = useCallback((next: Saved) => {
    setState(next);
    save(next);
  }, []);

  const running = state.endsAt !== null;
  const remaining = running ? Math.max(0, state.endsAt! - now) : state.remaining;

  // Tick while running; when time is up, log the session and switch modes.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (!running || remaining > 0) return;
    const finished = state.mode;
    if (finished === "focus") logFocusSession();
    const next: TimerMode = finished === "focus" ? "break" : "focus";
    update({ mode: next, endsAt: null, remaining: DURATION[next] });
    finishRef.current?.(finished);
  }, [running, remaining, state.mode, update]);

  // Show the countdown in the browser tab while it runs.
  useEffect(() => {
    if (!running) return;
    const original = document.title;
    document.title = `${format(remaining)} · Study Hub`;
    return () => {
      document.title = original;
    };
  }, [running, remaining]);

  return {
    ready,
    mode: state.mode,
    running,
    remaining,
    total: DURATION[state.mode],
    start: () => {
      setNow(Date.now());
      update({ ...state, endsAt: Date.now() + state.remaining });
    },
    pause: () => update({ ...state, endsAt: null, remaining }),
    reset: () => update({ ...state, endsAt: null, remaining: DURATION[state.mode] }),
    setMode: (mode: TimerMode) => update({ mode, endsAt: null, remaining: DURATION[mode] }),
  };
}

export type FocusTimer = ReturnType<typeof useFocusTimer>;

/** 1500000 → "25:00" */
export function format(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
