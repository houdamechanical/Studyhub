"use client";

import { useEffect, useState } from "react";

const EVENT = "studyhub:data-changed";

/** Call after saving anything; every page using useLoad reloads its data. */
export function dataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export type LoadError = { code?: string; message: string };
export type LoadState<T> = { loading: boolean; data: T | null; error: LoadError | null };

/**
 * Load data in the browser (the app is a static site, so there is no server).
 * Re-runs when `key` changes and after dataChanged(). The first load shows a
 * loading state; later reloads keep the old data on screen until new data arrives.
 */
export function useLoad<T>(load: () => Promise<T>, key: string): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ loading: true, data: null, error: null });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: s.data === null }));
    const run = () =>
      load().then(
        (data) => alive && setState({ loading: false, data, error: null }),
        (error: LoadError) => alive && setState({ loading: false, data: null, error }),
      );
    run();
    window.addEventListener(EVENT, run);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, run);
    };
    // `load` is recreated every render; `key` says when the request actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/** Throw Supabase errors so useLoad can show them. */
export function must<T>(result: { data: T | null; error: LoadError | null }): T {
  if (result.error) throw result.error;
  return result.data as T;
}
