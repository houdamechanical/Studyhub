"use client";

import { Check, ImageUp, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { AnimatedAvatar, AVATAR_NAMES, UserAvatar } from "@/components/user-avatar";
import { useI18n } from "@/lib/i18n/client";
import { AVATAR_PRESETS, setAvatarValue, uploadAvatar } from "@/lib/people";
import { cn } from "@/lib/utils";

/** Choose an animated avatar, upload a photo, or go back to the initial letter. */
export function AvatarPicker({ onClose }: { onClose: () => void }) {
  const { userId, nickname, avatar, setAvatar } = useAuth();
  const { dict } = useI18n();
  const t = dict.friends;
  const [busy, setBusy] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

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

  async function done(r: Awaited<ReturnType<typeof setAvatarValue>>) {
    setBusy(null);
    if (!r.ok) {
      toast(r.error === "tooBig" ? t.picTooBig : r.error === "notImage" ? t.picNotImage : dict.common.error.failed, "error");
      return;
    }
    setAvatar(r.value);
    toast(t.picSaved);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="pic-title">
      <button type="button" aria-hidden tabIndex={-1} onClick={onClose} className="dialog-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="dialog-panel relative w-full max-w-lg overflow-hidden rounded-t-2xl border bg-popover shadow-2xl sm:rounded-2xl">
        <header className="flex items-center gap-3 border-b px-5 py-4">
          <UserAvatar avatar={avatar} name={nickname} className="size-10" />
          <h2 id="pic-title" className="flex-1 font-display text-lg font-semibold">
            {t.pickTitle}
          </h2>
          <button type="button" onClick={onClose} aria-label={dict.quiz.close} className="press flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[70dvh] overflow-y-auto p-5">
          <p className="mb-3 text-sm font-semibold">{t.pickAnimated}</p>
          <ul className="grid grid-cols-4 gap-3">
            {AVATAR_PRESETS.map((id) => {
              const value = `a:${id}`;
              const on = avatar === value;
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={async () => {
                      setBusy(value);
                      done(await setAvatarValue(userId, value));
                    }}
                    aria-pressed={on}
                    className={cn(
                      "press group relative flex w-full flex-col items-center gap-1.5 rounded-2xl border p-2 transition-colors",
                      on ? "border-primary bg-[color-mix(in_srgb,var(--c-amber)_10%,transparent)]" : "hover:border-[var(--c-border-strong)]",
                    )}
                  >
                    <AnimatedAvatar id={id} className="aspect-square w-full max-w-20" />
                    <span className="text-xs font-medium text-muted-foreground">{AVATAR_NAMES[id]}</span>
                    {busy === value && <Loader2 className="absolute end-2 top-2 size-4 animate-spin" />}
                    {on && busy !== value && (
                      <span className="absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
            <input
              ref={file}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setBusy("upload");
                done(await uploadAvatar(userId, f));
              }}
            />
            <Button onClick={() => file.current?.click()} disabled={busy !== null}>
              {busy === "upload" ? <Loader2 className="animate-spin" /> : <ImageUp />}
              {busy === "upload" ? t.uploading : t.upload}
            </Button>
            {avatar && (
              <Button
                variant="ghost"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy("remove");
                  done(await setAvatarValue(userId, null));
                }}
              >
                <Trash2 />
                {t.removePic}
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t.picHint}</p>
        </div>
      </div>
    </div>
  );
}
