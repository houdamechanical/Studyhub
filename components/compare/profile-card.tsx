"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { saveNickname, setGradeShare } from "@/lib/mutations/compare";
import { Button } from "@/components/ui/button";
import { controlClass, FormError } from "@/components/ui/field";
import { NICKNAME_PATTERN } from "@/lib/compare";
import { useAuth } from "@/components/auth-gate";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export function ProfileCard({ nickname, shared }: { nickname: string; shared: SubjectId[] }) {
  const { locale, dict } = useI18n();
  const t = dict.compare;
  const { setNickname } = useAuth();
  const [nick, setNick] = useState(nickname);
  const [saved, setSaved] = useState(false);
  const [shares, setShares] = useState(new Set(shared));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valid = NICKNAME_PATTERN.test(nick.trim());

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await saveNickname(nick);
      if (r.ok) {
        setSaved(true);
        setNickname(nick.trim());
      }
      else setError(dict.common.error[r.error]);
    });
  }

  function toggle(subject: SubjectId) {
    const on = !shares.has(subject);
    const next = new Set(shares);
    if (on) next.add(subject);
    else next.delete(subject);
    setShares(next); // optimistic
    setError(null);
    startTransition(async () => {
      const r = await setGradeShare(subject, on);
      if (!r.ok) {
        setShares(new Set(shares)); // roll back
        setError(dict.common.error[r.error]);
      }
    });
  }

  return (
    <section id="name" className="flex scroll-mt-24 flex-col gap-5 rounded-3xl border bg-card p-5">
      <form onSubmit={save} className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="font-display text-lg font-bold">
          {t.nicknameTitle}
        </label>
        <div className="flex gap-2">
          <input
            id="nickname"
            className={controlClass}
            value={nick}
            onChange={(e) => {
              setNick(e.target.value);
              setSaved(false);
            }}
            maxLength={20}
            autoComplete="off"
            dir="auto"
            aria-invalid={!valid}
          />
          <Button type="submit" disabled={pending || !valid || nick.trim() === nickname}>
            {saved ? <Check size={16} /> : dict.common.save}
          </Button>
        </div>
        <p className={cn("text-xs", valid ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400")}>
          {valid ? t.nicknameHint : t.nicknameRule}
        </p>
      </form>

      <fieldset>
        <legend className="text-sm font-medium">{t.shareTitle}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{t.shareHint}</p>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECT_IDS.map((id) => {
            const on = shares.has(id);
            return (
              <button
                key={id}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  on ? "border-transparent bg-brand text-white shadow-md shadow-fuchsia-500/25" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {on && <Check size={14} />}
                {SUBJECTS[id].label[locale]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <FormError message={error} />
    </section>
  );
}
