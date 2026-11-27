"use client";

import {
  Award,
  CalendarCheck,
  Check,
  Clock,
  Compass,
  Footprints,
  Lock,
  Pencil,
  Rocket,
  Star,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { Loaded } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { SetupNotice } from "@/components/setup-notice";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import {
  acceptFriend,
  ACHIEVEMENTS,
  addFriend,
  loadProfile,
  removeFriend,
  type AchievementId,
  type PlayerStats,
} from "@/lib/friends";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

// /profile        -> your own profile
// /profile?id=…   -> someone else's
export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileLoader />
    </Suspense>
  );
}

function ProfileLoader() {
  const { userId } = useAuth();
  const { dict } = useI18n();
  const id = useSearchParams().get("id") || userId;
  const state = useLoad(() => loadProfile(id), `profile:${id}`);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <Loaded state={state}>
        {({ missing, stats }) =>
          missing ? (
            <SetupNotice problem="no-table" />
          ) : !stats ? (
            <>
              <PageHero back={{ href: "/communities", label: dict.communities.title }} title={dict.friends.notFound} />
            </>
          ) : (
            <ProfileView stats={stats} />
          )
        }
      </Loaded>
    </div>
  );
}

const ICON: Record<AchievementId, LucideIcon> = {
  first: Footprints,
  five: Rocket,
  twentyFive: Zap,
  perfect: Star,
  perfectFive: Trophy,
  allrounder: Compass,
  streak: CalendarCheck,
  xp500: Award,
  friend: Users,
};

function ProfileView({ stats }: { stats: PlayerStats }) {
  const { locale, dict } = useI18n();
  const t = dict.friends;
  const nf = new Intl.NumberFormat(intlLocale(locale));
  const since = new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(new Date(stats.joined));
  const earned = ACHIEVEMENTS.filter((a) => a.value(stats) >= a.goal).length;

  const figures = [
    { label: t.xp, value: nf.format(stats.xp) },
    { label: t.testsDone, value: nf.format(stats.tests_done) },
    { label: t.bestAvg, value: stats.best_avg === null ? "–" : `${nf.format(Math.round(stats.best_avg * 100))} %` },
    { label: t.friendsCount, value: nf.format(stats.friends) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHero back={{ href: "/communities", label: dict.communities.title }} title={stats.nickname} />

      <section className="enter -mt-4 flex flex-wrap items-center gap-x-5 gap-y-4">
        <span
          aria-hidden
          className="flex size-16 shrink-0 sm:size-20 items-center justify-center rounded-full bg-primary font-display text-3xl font-semibold uppercase text-primary-foreground shadow-card sm:text-4xl"
        >
          {stats.nickname.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-muted-foreground">{fill(t.joined, { date: since })}</p>
          {stats.relation === "self" && <p className="mt-1 text-sm font-medium text-[var(--c-amber)]">{t.you}</p>}
        </div>
        <FriendActions stats={stats} />
      </section>

      <dl className="enter grid grid-cols-2 divide-x divide-y rounded-xl border bg-card shadow-card sm:grid-cols-4 sm:divide-y-0 rtl:divide-x-reverse">
        {figures.map((f) => (
          <div key={f.label} className="px-4 py-4">
            <dt className="text-sm text-muted-foreground">{f.label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="enter">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold">{t.achievements}</h2>
          <p className="text-sm text-muted-foreground tabular-nums">{fill(t.unlocked, { n: earned, total: ACHIEVEMENTS.length })}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t.achievementsHint}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const value = a.value(stats);
            const done = value >= a.goal;
            const Icon = ICON[a.id];
            const [name, how] = t.a[a.id];
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  done ? "bg-card shadow-card" : "border-dashed bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-11 shrink-0 items-center justify-center rounded-full",
                    done ? "bg-[color-mix(in_srgb,var(--c-amber)_16%,transparent)] text-[var(--c-amber)]" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden />
                  {!done && (
                    <span className="absolute -bottom-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
                      <Lock size={9} strokeWidth={2.5} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-semibold leading-tight", !done && "text-muted-foreground")}>{name}</span>
                  <span className="block text-sm text-muted-foreground">{how}</span>
                  {!done && a.goal > 1 && (
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <span className="block h-full rounded-full bg-[var(--c-amber)]" style={{ width: `${Math.min(100, (value / a.goal) * 100)}%` }} />
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {nf.format(Math.min(value, a.goal))}/{nf.format(a.goal)}
                      </span>
                    </span>
                  )}
                </span>
                <span className="sr-only">{done ? "✓" : ""}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Add / accept / pending / friends – depending on how you two are connected. */
function FriendActions({ stats }: { stats: PlayerStats }) {
  const { userId } = useAuth();
  const { dict } = useI18n();
  const t = dict.friends;
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const name = stats.nickname;

  async function run(action: () => Promise<{ ok: boolean }>, done: string) {
    setPending(true);
    const r = await action();
    setPending(false);
    setConfirm(false);
    toast(r.ok ? done : dict.common.error.failed, r.ok ? "success" : "error");
  }

  switch (stats.relation) {
    case "self":
      return (
        <Button asChild variant="outline">
          <Link href="/settings">
            <Pencil />
            {t.editName}
          </Link>
        </Button>
      );
    case "none":
      return (
        <Button onClick={() => run(() => addFriend(stats.user_id), fill(t.added, { name }))} disabled={pending}>
          <UserPlus />
          {t.add}
        </Button>
      );
    case "outgoing":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={15} aria-hidden />
            {t.requested}
          </span>
          <Button variant="outline" onClick={() => run(() => removeFriend(stats.user_id, userId), t.removed)} disabled={pending}>
            <X />
            {t.cancel}
          </Button>
        </div>
      );
    case "incoming":
      return (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(() => acceptFriend(stats.user_id, userId), fill(t.nowFriends, { name }))} disabled={pending}>
            <Check />
            {t.accept}
          </Button>
          <Button variant="outline" onClick={() => run(() => removeFriend(stats.user_id, userId), t.removed)} disabled={pending}>
            {t.decline}
          </Button>
        </div>
      );
    case "friends":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--c-sage)_14%,transparent)] px-3 py-1.5 text-sm font-medium text-[var(--c-sage)]">
            <Check size={15} strokeWidth={3} aria-hidden />
            {t.isFriend}
          </span>
          <Button variant="ghost" onClick={() => setConfirm(true)} disabled={pending} aria-label={t.remove}>
            <UserMinus />
          </Button>
          {confirm && (
            <ConfirmDialog
              title={fill(t.removeTitle, { name })}
              body={t.removeBody}
              confirmLabel={t.remove}
              cancelLabel={dict.communities.cancel}
              destructive
              pending={pending}
              onConfirm={() => run(() => removeFriend(stats.user_id, userId), t.removed)}
              onCancel={() => setConfirm(false)}
            />
          )}
        </div>
      );
  }
}
