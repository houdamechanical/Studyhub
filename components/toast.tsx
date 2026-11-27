"use client";

import { Check, Info, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const EVENT = "studyhub:toast";
let nextId = 1;

/** Show a short message in the corner. Works from anywhere (no context needed). */
export function toast(message: string, tone: Tone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Toast>(EVENT, { detail: { id: nextId++, message, tone } }));
}

const ICON = { success: Check, error: TriangleAlert, info: Info };
const COLOR = { success: "text-[var(--c-sage)]", error: "text-destructive", info: "text-[var(--c-slate)]" };

/** Mount once. Toasts stack bottom-centre (above the tab bar), live for 3.5 s (errors 6 s). */
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setItems((list) => [...list.slice(-2), t]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), t.tone === "error" ? 6000 : 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {items.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="toast-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7)]"
          >
            <Icon size={16} className={cn("shrink-0", COLOR[t.tone])} />
            <span className="min-w-0 flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))}
              aria-label="Close"
              className="hit -me-1 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
