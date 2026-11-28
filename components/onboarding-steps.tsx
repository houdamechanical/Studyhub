"use client";

import { ArrowRight, Check, ImageUp, Loader2, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/toast";
import { AnimatedAvatar, AVATAR_NAMES, UserAvatar } from "@/components/user-avatar";
import { addFriend } from "@/lib/friends";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { AVATAR_PRESETS, setAvatarValue, uploadAvatar } from "@/lib/people";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { AUTO_NICKNAME } from "@/components/name-onboarding";

/** First run after signing up: 1 name · 2 picture · 3 friends · 4 subjects. */
export const ONBOARDING_STEPS = 4;

function Shell({ step, title, subtitle, children, footer }: { step: number; title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  const { dict } = useI18n();
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="enter w-full max-w-md rounded-xl border bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex flex-1 gap-1.5" aria-hidden>
            {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-[var(--c-amber)]" : "bg-[var(--c-border)]")} />
            ))}
          </span>
          <span className="label-mono">{fill(dict.onboarding.stepOf, { n: step, total: ONBOARDING_STEPS })}</span>
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold leading-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 flex items-center gap-3">{footer}</div>
      </div>
    </div>
  );
}

function NextButton({ onClick, label, busy }: { onClick: () => void; label: string; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="press group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="animate-spin" size={18} /> : label}
      {!busy && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" />}
    </button>
  );
}

/** Step 2: an animated avatar or your own photo (can be skipped). */
export function PictureStep({ userId, nickname, avatar, onAvatar, onDone }: { userId: string; nickname: string; avatar: string | null; onAvatar: (v: string | null) => void; onDone: () => void }) {
  const { dict } = useI18n();
  const t = dict.onboarding;
  const f = dict.friends;
  const [busy, setBusy] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function apply(promise: ReturnType<typeof setAvatarValue>) {
    const r = await promise;
    setBusy(null);
    if (!r.ok) return toast(r.error === "tooBig" ? f.picTooBig : r.error === "notImage" ? f.picNotImage : dict.common.error.failed, "error");
    onAvatar(r.value);
  }

  return (
    <Shell
      step={2}
      title={t.picTitle}
      subtitle={t.picSubtitle}
      footer={
        <>
          {!avatar && (
            <button type="button" onClick={onDone} className="press h-12 rounded-xl px-4 font-medium text-muted-foreground hover:text-foreground">
              {t.later}
            </button>
          )}
          <NextButton onClick={onDone} label={t.next} />
        </>
      }
    >
      <div className="mb-5 flex justify-center">
        <UserAvatar userId={userId} avatar={avatar} name={nickname} className="size-24 text-4xl shadow-card" />
      </div>
      <ul className="grid grid-cols-4 gap-2.5">
        {AVATAR_PRESETS.map((id) => {
          const value = `a:${id}`;
          const on = avatar === value;
          return (
            <li key={id}>
              <button
                type="button"
                disabled={busy !== null}
                aria-pressed={on}
                aria-label={AVATAR_NAMES[id]}
                onClick={() => {
                  setBusy(value);
                  apply(setAvatarValue(userId, value));
                }}
                className={cn("press relative block w-full rounded-full ring-2 ring-offset-2 ring-offset-card transition-shadow", on ? "ring-[var(--c-amber)]" : "ring-transparent hover:ring-[var(--c-border-strong)]")}
              >
                <AnimatedAvatar id={id} className="aspect-square w-full" />
                {busy === value && <Loader2 className="absolute inset-0 m-auto size-5 animate-spin text-white" />}
              </button>
            </li>
          );
        })}
      </ul>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (!picked) return;
          setBusy("upload");
          apply(uploadAvatar(userId, picked));
        }}
      />
      <button
        type="button"
        onClick={() => file.current?.click()}
        disabled={busy !== null}
        className="tile press mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold"
      >
        {busy === "upload" ? <Loader2 className="animate-spin" size={18} /> : <ImageUp size={18} />}
        {busy === "upload" ? f.uploading : f.upload}
      </button>
    </Shell>
  );
}

type Person = { user_id: string; nickname: string; avatar: string | null; admin: boolean };

/** Five people to add: the admin always first, then four at random. */
async function loadSuggestions(me: string): Promise<Person[]> {
  const supabase = createClient();
  const [admins, rows] = await Promise.all([
    supabase.rpc("admin_ids"),
    supabase.from("profiles").select("user_id, nickname, avatar").neq("user_id", me).limit(300),
  ]);
  const adminSet = new Set(((admins.data as string[] | null) ?? []).filter(Boolean));
  const list = ((rows.data as Omit<Person, "admin">[] | null) ?? []).filter((p) => p.nickname && !AUTO_NICKNAME.test(p.nickname));
  const first = list.filter((p) => adminSet.has(p.user_id)).map((p) => ({ ...p, admin: true }));
  const others = list.filter((p) => !adminSet.has(p.user_id));
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return [...first, ...others.map((p) => ({ ...p, admin: false }))].slice(0, 5);
}

/** Step 3: suggested friends. */
export function FriendsStep({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { dict } = useI18n();
  const t = dict.onboarding;
  const [people, setPeople] = useState<Person[] | null>(null);
  const [sent, setSent] = useState<Record<string, "busy" | "done">>({});

  useEffect(() => {
    let alive = true;
    loadSuggestions(userId).then(
      (list) => alive && setPeople(list),
      () => alive && setPeople([]),
    );
    return () => {
      alive = false;
    };
  }, [userId]);

  async function add(id: string) {
    setSent((s) => ({ ...s, [id]: "busy" }));
    const r = await addFriend(id);
    setSent((s) => {
      const next = { ...s };
      if (r.ok) next[id] = "done";
      else delete next[id];
      return next;
    });
    if (!r.ok) toast(dict.common.error.failed, "error");
  }

  return (
    <Shell step={3} title={t.friendsTitle} subtitle={t.friendsSubtitle} footer={<NextButton onClick={onDone} label={t.next} />}>
      {!people ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : people.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{t.noPeople}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {people.map((p) => {
            const state = sent[p.user_id];
            return (
              <li key={p.user_id} className="tile flex items-center gap-3 rounded-xl p-2.5 pe-3">
                <UserAvatar userId={p.user_id} avatar={p.avatar} name={p.nickname} className="size-11 text-base" still />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold" dir="auto">
                    {p.nickname}
                  </span>
                  {p.admin && <span className="block text-xs font-medium text-[var(--c-amber)]">Admin</span>}
                </span>
                <button
                  type="button"
                  onClick={() => add(p.user_id)}
                  disabled={state !== undefined}
                  className={cn(
                    "press flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
                    state === "done" ? "bg-[color-mix(in_srgb,var(--c-sage)_14%,transparent)] text-[var(--c-sage)]" : "bg-primary text-primary-foreground",
                  )}
                >
                  {state === "busy" ? <Loader2 size={15} className="animate-spin" /> : state === "done" ? <Check size={15} /> : <UserPlus size={15} />}
                  {state === "done" ? t.requested : t.add}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}
