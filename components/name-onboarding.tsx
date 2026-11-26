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
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="enter w-full max-w-md rounded-xl border bg-card p-7 sm:p-9"
      >
        <p className="text-sm font-medium text-muted-foreground">{t.hello}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">
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
          className="mt-6 h-14 w-full rounded-xl border bg-background px-4 font-display text-xl font-semibold outline-none transition-colors placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:text-muted-foreground/70 focus:border-primary aria-[invalid]:border-destructive"
        />
        <p id="name-rule" className={error ? "mt-2 text-sm text-destructive" : "mt-2 text-xs text-muted-foreground"}>
          {error ?? t.rule}
        </p>

        <button
          type="submit"
          disabled={saving || name.trim().length === 0}
          className="group mt-6 flex h-14 w-full items-center justify-center gap-2 press rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : t.cta}
          {!saving && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" />}
        </button>
      </form>
    </div>
  );
}

