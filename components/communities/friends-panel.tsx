"use client";

import { Check, ChevronRight, Clock, Search, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { useLoad } from "@/lib/data";
import {
  acceptFriend,
  addFriend,
  loadFriends,
  removeFriend,
  searchPlayers,
  type Friend,
  type Player,
} from "@/lib/friends";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Your profile, finding classmates, requests and your friends. */
export function FriendsPanel() {
  const { userId, nickname } = useAuth();
  const { dict } = useI18n();
  const t = dict.friends;
  const state = useLoad(() => loadFriends(userId), `friends:${userId}`);
  if (state.data?.missing) return null; // friends migration not applied yet
  const list = state.data?.list ?? [];
  const incoming = list.filter((f) => f.relation === "incoming");
  const outgoing = list.filter((f) => f.relation === "outgoing");
  const friends = list.filter((f) => f.relation === "friends");

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold">{t.title}</h2>

      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-card transition-colors hover:bg-secondary/60"
      >
        <Avatar name={nickname} accent />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{t.myProfile}</span>
          <span className="block text-sm text-muted-foreground">{t.myProfileHint}</span>
        </span>
        <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
      </Link>

      <PlayerSearch known={list} />

      {incoming.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t.requests}</h3>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
            {incoming.map((f) => (
              <li key={f.user_id} className="flex items-center gap-3 px-4 py-2.5">
                <PersonLink f={f} />
                <RequestButtons id={f.user_id} name={f.nickname} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {friends.length === 0 && outgoing.length === 0 ? (
        state.data && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
          {[...friends, ...outgoing].map((f) => (
            <li key={f.user_id} className="flex items-center gap-3 px-4 py-2.5">
              <PersonLink f={f} />
              {f.relation === "outgoing" && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={13} aria-hidden />
                  {t.sent}
                </span>
              )}
              <ChevronRight size={16} className="shrink-0 text-muted-foreground rtl:rotate-180" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Avatar({ name, accent = false }: { name: string; accent?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full font-display font-semibold uppercase",
        accent ? "bg-primary text-primary-foreground" : "bg-[var(--c-pill)] text-foreground",
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

function PersonLink({ f }: { f: { user_id: string; nickname: string } }) {
  return (
    <Link href={`/profile?id=${f.user_id}`} className="flex min-w-0 flex-1 items-center gap-3 font-medium hover:underline underline-offset-4">
      <Avatar name={f.nickname} />
      <bdi className="truncate">{f.nickname}</bdi>
    </Link>
  );
}

function RequestButtons({ id, name }: { id: string; name: string }) {
  const { userId } = useAuth();
  const { dict } = useI18n();
  const t = dict.friends;
  const [pending, setPending] = useState(false);
  async function run(action: () => Promise<{ ok: boolean }>, done: string) {
    setPending(true);
    const r = await action();
    setPending(false);
    toast(r.ok ? done : dict.common.error.failed, r.ok ? "success" : "error");
  }
  return (
    <span className="flex shrink-0 gap-1.5">
      <Button size="sm" onClick={() => run(() => acceptFriend(id, userId), fill(t.nowFriends, { name }))} disabled={pending}>
        <Check />
        {t.accept}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => run(() => removeFriend(id, userId), t.removed)} disabled={pending} aria-label={t.decline}>
        <X />
      </Button>
    </span>
  );
}

/** Find classmates by name and add them. */
function PlayerSearch({ known }: { known: Friend[] }) {
  const { userId } = useAuth();
  const { dict } = useI18n();
  const t = dict.friends;
  const [text, setText] = useState("");
  const [results, setResults] = useState<Player[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (text.trim().length < 2) return setResults(null);
    let alive = true;
    const timer = setTimeout(() => {
      searchPlayers(text, userId).then(
        (r) => alive && setResults(r),
        () => alive && setResults([]),
      );
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [text, userId]);

  const relation = new Map(known.map((f) => [f.user_id, f.relation]));

  async function add(p: Player) {
    setBusy(p.user_id);
    const r = await addFriend(p.user_id);
    setBusy(null);
    toast(r.ok ? fill(t.added, { name: p.nickname }) : dict.common.error.failed, r.ok ? "success" : "error");
  }

  return (
    <div>
      <label htmlFor="player-search" className="mb-2 block text-sm font-semibold">
        {t.searchLabel}
      </label>
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id="player-search"
          type="search"
          className={cn(controlClass, "ps-10")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.searchPlaceholder}
          autoComplete="off"
          dir="auto"
        />
      </div>
      {results && (
        <ul className="mt-2 divide-y overflow-hidden rounded-xl border bg-card shadow-card" aria-live="polite">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">{t.noResults}</li>}
          {results.map((p) => {
            const rel = relation.get(p.user_id);
            return (
              <li key={p.user_id} className="flex items-center gap-3 px-4 py-2.5">
                <PersonLink f={p} />
                {rel === "friends" ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--c-sage)]">
                    <Check size={15} strokeWidth={3} aria-hidden />
                    {t.isFriend}
                  </span>
                ) : rel === "outgoing" ? (
                  <span className="shrink-0 text-sm text-muted-foreground">{t.requested}</span>
                ) : (
                  <Button size="sm" variant={rel === "incoming" ? "default" : "outline"} onClick={() => add(p)} disabled={busy === p.user_id}>
                    {rel === "incoming" ? <Check /> : <UserPlus />}
                    {rel === "incoming" ? t.accept : t.add}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
