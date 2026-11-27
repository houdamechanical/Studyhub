"use client";

import { Check, ChevronRight, Clock, Lock, Search, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { SetupNotice } from "@/components/setup-notice";
import { useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import { CURRENT_SEMESTER, formatNC, ncFromScore } from "@/lib/grades";
import {
  acceptFriend,
  addFriend,
  loadFriendRows,
  loadFriends,
  removeFriend,
  searchPlayers,
  type Friend,
  type Player,
} from "@/lib/friends";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Sort = "nc" | "name" | "xp";

/** The Friends page: your profile, finding classmates, requests and your friends (sortable). */
export function FriendsView() {
  const { userId, nickname } = useAuth();
  const { locale, dict } = useI18n();
  const t = dict.friends;
  const requests = useLoad(() => loadFriends(userId), `friends:${userId}`);
  const rows = useLoad(() => loadFriendRows(CURRENT_SEMESTER), `friend-rows:${userId}`);
  const [sort, setSort] = useState<Sort>("nc");
  if (requests.data?.missing || rows.data?.missing) return <SetupNotice problem="no-table" />;
  const all = requests.data?.list ?? [];
  const incoming = all.filter((f) => f.relation === "incoming");
  const outgoing = all.filter((f) => f.relation === "outgoing");
  const nf = intlLocale(locale);
  const xpf = new Intl.NumberFormat(nf);

  const friends = [...(rows.data?.list ?? [])].sort((a, b) => {
    if (sort === "name") return a.nickname.localeCompare(b.nickname, nf);
    if (sort === "xp") return b.xp - a.xp || a.nickname.localeCompare(b.nickname, nf);
    // NC: best (highest score) first; friends who don't share go last.
    if (a.score === null && b.score === null) return a.nickname.localeCompare(b.nickname, nf);
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  return (
    <div className="flex flex-col gap-8">
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

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">{t.requests}</h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
            {incoming.map((f) => (
              <li key={f.user_id} className="flex items-center gap-3 px-4 py-2.5">
                <PersonLink f={f} />
                <RequestButtons id={f.user_id} name={f.nickname} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{t.yourFriends}</h2>
          <div role="radiogroup" aria-label={t.sortBy} className="inline-flex rounded-lg border bg-card p-1 shadow-card">
            {(["nc", "name", "xp"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={sort === id}
                onClick={() => setSort(id)}
                className={cn(
                  "press rounded-md px-3 py-1.5 text-sm font-medium",
                  sort === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {id === "nc" ? t.sortNc : id === "name" ? t.sortName : t.sortXp}
              </button>
            ))}
          </div>
        </div>
        {rows.data === null ? (
          <div className="h-32 animate-pulse rounded-xl bg-secondary" aria-busy />
        ) : friends.length === 0 && outgoing.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
            {friends.map((f) => (
              <li key={f.user_id}>
                <Link href={`/profile?id=${f.user_id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60">
                  <Avatar name={f.nickname} />
                  <span className="min-w-0 flex-1">
                    <bdi className="block truncate font-medium">{f.nickname}</bdi>
                    <span className="block text-sm tabular-nums text-muted-foreground">
                      {xpf.format(f.xp)} XP · {f.tests === 1 ? t.oneTest : fill(t.testsCount, { n: f.tests })}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    {f.they_share ? (
                      <>
                        <span className="block text-xs text-muted-foreground">{t.nc}</span>
                        <span className="block font-display text-xl font-semibold tabular-nums">
                          {f.score === null ? "–" : formatNC(ncFromScore(f.score), nf)}
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock size={12} aria-hidden />
                        {t.notSharing}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground rtl:rotate-180" />
                </Link>
              </li>
            ))}
            {outgoing.map((f) => (
              <li key={f.user_id} className="flex items-center gap-3 px-4 py-3">
                <PersonLink f={f} />
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={13} aria-hidden />
                  {t.sent}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PlayerSearch known={all} />
    </div>
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
    <section>
      <label htmlFor="player-search" className="mb-3 block font-display text-xl font-semibold">
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
    </section>
  );
}
