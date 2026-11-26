"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { NICKNAME_PATTERN } from "@/lib/compare";
import { useI18n } from "@/lib/i18n/client";
import { saveNickname } from "@/lib/mutations/compare";

/** Names the database gives new users until they pick their own. */
export const AUTO_NICKNAME = /^Student-[0-9a-f]{5}$/;

/**
 * First screen after signing up: pick the name shown on leaderboards and in
 * "Welcome back, …". Shown while the account still has a generated name.
 */
export function NameOnboarding({ onDone }: { onDone: (name: string) => void }) {
  const { dict } = useI18n();
  const t = dict.onboarding;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!NICKNAME_PATTERN.test(value)) {
      setError(t.invalid);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await saveNickname(value);
    setSaving(false);
    if (res.ok) onDone(value);
    else setError(res.error === "taken" ? t.taken : res.error === "invalid" ? t.invalid : t.failed);
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand px-4 py-10">
      <Blobs />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-4xl bg-background/90 p-7 shadow-2xl ring-1 ring-white/40 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500 sm:p-9"
      >
        <div className="mb-5 inline-block origin-[70%_70%] text-5xl motion-safe:animate-float" aria-hidden>
          👋
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t.hello}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>

        <label htmlFor="name" className="sr-only">
          {t.placeholder}
        </label>
        <input
          id="name"
          autoFocus
          autoComplete="nickname"
          autoCapitalize="words"
          maxLength={20}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder={t.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby="name-rule"
          className="mt-6 h-14 w-full rounded-2xl border-2 bg-card px-4 font-display text-2xl font-bold tracking-tight outline-none transition-colors placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-primary aria-[invalid]:border-destructive"
        />
        <p id="name-rule" className={error ? "mt-2 text-sm text-destructive" : "mt-2 text-xs text-muted-foreground"}>
          {error ?? t.rule}
        </p>

        <button
          type="submit"
          disabled={saving || name.trim().length === 0}
          className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-lg shadow-fuchsia-500/30 transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : t.cta}
          {!saving && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" />}
        </button>
      </form>
    </div>
  );
}

/** Slowly drifting colour blobs (decoration). */
export function Blobs({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -left-24 -top-24 size-80 rounded-full bg-cyan-300/50 blur-3xl motion-safe:animate-blob" />
      <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-yellow-300/40 blur-3xl motion-safe:animate-blob [animation-delay:-6s]" />
      <div className="absolute left-1/3 top-1/2 size-72 rounded-full bg-pink-400/40 blur-3xl motion-safe:animate-blob [animation-delay:-12s]" />
    </div>
  );
}
