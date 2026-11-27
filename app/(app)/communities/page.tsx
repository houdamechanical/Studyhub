"use client";

import { ChevronRight, Globe, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CommunityAvatar } from "@/components/communities/avatar";
import { FriendsPanel } from "@/components/communities/friends-panel";
import { Loaded } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { SetupNotice } from "@/components/setup-notice";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { createCommunity, joinCommunity, loadMyCommunities, type Community } from "@/lib/communities";
import { useLoad } from "@/lib/data";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export default function CommunitiesPage() {
  const { dict } = useI18n();
  const t = dict.communities;
  useTitle(t.title);
  const state = useLoad(loadMyCommunities, "communities");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero back={{ href: "/home", label: dict.school.backHome }} title={t.title} subtitle={t.subtitle} />
      <div className="mt-6">
        <Loaded state={state}>
          {({ list, missing }) => (missing ? <SetupNotice problem="no-table" /> : <CommunitiesView list={list} />)}
        </Loaded>
      </div>
    </div>
  );
}

function CommunitiesView({ list }: { list: Community[] }) {
  const { dict } = useI18n();
  const t = dict.communities;
  return (
    <div className="flex flex-col gap-8">
      <FriendsPanel />

      <h2 className="-mb-4 font-display text-2xl font-semibold">{t.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <CreateForm />
        <JoinForm />
      </div>

      <section>
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
            {list.map((c) => (
              <li key={c.id}>
                <Link href={`/communities/view?id=${c.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60">
                  <CommunityAvatar name={c.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium" dir="auto">
                      {c.name}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {c.members === 1 ? t.oneMember : fill(t.members, { n: c.members })}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/compare" className="flex items-center gap-3 rounded-xl border bg-card shadow-card px-4 py-3 transition-colors hover:bg-secondary/60">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Globe size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{t.publicBoard}</span>
          <span className="block text-sm text-muted-foreground">{t.publicHint}</span>
        </span>
        <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
      </Link>
    </div>
  );
}

function CreateForm() {
  const { dict } = useI18n();
  const t = dict.communities;
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const valid = name.trim().length >= 2;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    const r = await createCommunity(name);
    setPending(false);
    if (!r.ok) return toast(dict.common.error.failed, "error");
    toast(t.created);
    router.push(`/communities/view?id=${r.id}`);
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl border bg-card shadow-card p-4">
      <label htmlFor="community-name" className="text-sm font-medium">
        {t.createTitle}
      </label>
      <div className="flex gap-2">
        <input id="community-name" className={controlClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t.namePlaceholder} dir="auto" />
        <Button type="submit" disabled={!valid || pending}>
          <Plus />
          {t.create}
        </Button>
      </div>
    </form>
  );
}

function JoinForm() {
  const { dict } = useI18n();
  const t = dict.communities;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (clean.length !== 6) return;
    setPending(true);
    setError(null);
    const r = await joinCommunity(clean);
    setPending(false);
    if (!r.ok) return setError(r.error === "notFound" ? t.notFound : r.error === "full" ? t.full : dict.common.error.failed);
    router.push(`/communities/view?id=${r.id}`);
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl border bg-card shadow-card p-4">
      <label htmlFor="community-code" className="text-sm font-medium">
        {t.joinTitle}
      </label>
      <div className="flex gap-2">
        <input
          id="community-code"
          className={cn(controlClass, "font-mono uppercase tracking-[0.25em]")}
          value={clean}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder={t.codePlaceholder}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          dir="ltr"
        />
        <Button type="submit" variant="outline" disabled={clean.length !== 6 || pending}>
          {t.join}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
