"use client";

import { Check, Copy, Crown, LogOut, SendHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CommunityAvatar } from "@/components/communities/avatar";
import { useAuth } from "@/components/auth-gate";
import { Breadcrumb } from "@/components/breadcrumb";
import { Leaderboard } from "@/components/compare/leaderboard";
import { Loaded } from "@/components/page-shell";
import { SubjectIcon } from "@/components/subject-icon";
import { toast } from "@/components/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  leaveCommunity,
  loadCommunity,
  loadCommunityBoard,
  MESSAGE_SELECT,
  sendMessage,
  toMessage,
  type Member,
  type Message,
} from "@/lib/communities";
import { useLoad } from "@/lib/data";
import { intlLocale } from "@/lib/format";
import { formatPoints } from "@/lib/gradebook";
import { CURRENT_SEMESTER, formatNC, ncFromScore, toPoints } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { fill, formatSemester } from "@/lib/i18n/dictionaries";
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// /communities/view?id=…
export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityLoader />
    </Suspense>
  );
}

function CommunityLoader() {
  const id = useSearchParams().get("id") ?? "";
  const { dict } = useI18n();
  const state = useLoad(() => loadCommunity(id), `community:${id}`);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-6 sm:pt-8">
      <Loaded state={state}>
        {(data) =>
          data ? (
            <CommunityView key={id} {...data} />
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{dict.communities.gone}</p>
          )
        }
      </Loaded>
    </div>
  );
}

type Tab = "chat" | "board" | "members";

function CommunityView({
  community,
  members,
  messages,
}: NonNullable<Awaited<ReturnType<typeof loadCommunity>>>) {
  const { dict } = useI18n();
  const t = dict.communities;
  const { userId } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("chat");
  const [leaving, setLeaving] = useState(false);
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    const ok = await leaveCommunity(community.id, userId);
    setPending(false);
    setLeaving(false);
    if (!ok) return toast(dict.common.error.failed, "error");
    toast(fill(t.left, { name: community.name }));
    router.push("/communities");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "chat", label: t.chat },
    { id: "board", label: t.board },
    { id: "members", label: `${t.membersTab} · ${members.length}` },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <Breadcrumb items={[{ label: t.title, href: "/communities" }, { label: community.name }]} />
      <header className="mt-3 flex flex-wrap items-center gap-3">
        <CommunityAvatar name={community.name} className="size-11 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-semibold" dir="auto">
            {community.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {members.length === 1 ? t.oneMember : fill(t.members, { n: members.length })}
          </p>
        </div>
        <InviteCode code={community.code} />
        <button
          type="button"
          onClick={() => setLeaving(true)}
          className="press hit flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut size={15} className="rtl:rotate-180" />
          {t.leave}
        </button>
      </header>

      <div role="tablist" className="mt-5 flex gap-1 border-b">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === x.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {tab === "chat" && <Chat communityId={community.id} initial={messages} members={members} />}
        {tab === "board" && <CommunityBoard communityId={community.id} />}
        {tab === "members" && <Members members={members} creator={community.created_by} />}
      </div>

      {leaving && (
        <ConfirmDialog
          title={fill(t.leaveTitle, { name: community.name })}
          body={t.leaveBody}
          confirmLabel={t.leave}
          cancelLabel={t.cancel}
          destructive
          pending={pending}
          onConfirm={leave}
          onCancel={() => setLeaving(false)}
        />
      )}
    </div>
  );
}

function InviteCode({ code }: { code: string }) {
  const { dict } = useI18n();
  const t = dict.communities;
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast(t.copied);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code is still visible */
    }
  }
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg border bg-card ps-3 text-sm">
      <span className="text-muted-foreground">{t.invite}</span>
      <span className="font-mono font-semibold tracking-[0.18em]" dir="ltr">
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={t.copy}
        title={t.copy}
        className="press flex size-9 items-center justify-center rounded-e-lg text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check size={15} className="check-pop text-[var(--c-sage)]" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function Chat({ communityId, initial, members }: { communityId: string; initial: Message[]; members: Member[] }) {
  const { dict, locale } = useI18n();
  const t = dict.communities;
  const { userId, nickname } = useAuth();
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const names = useMemo(() => new Map(members.map((m) => [m.user_id, m.nickname])), [members]);

  const add = useCallback((incoming: Message[]) => {
    setMessages((list) => {
      const seen = new Set(list.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...list, ...fresh].sort((a, b) => a.created_at.localeCompare(b.created_at)) : list;
    });
  }, []);

  // Live: Supabase Realtime, plus a quiet refresh every 15 s in case Realtime isn't enabled.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`community:${communityId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `community_id=eq.${communityId}` },
        (payload) => {
          const m = payload.new as { id: string; user_id: string; body: string; created_at: string };
          add([{ ...m, nickname: names.get(m.user_id) ?? "…" }]);
        },
      )
      .subscribe();
    const timer = setInterval(async () => {
      if (document.hidden) return;
      const { data } = await supabase
        .from("community_messages")
        .select(MESSAGE_SELECT)
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) add((data as unknown as Parameters<typeof toMessage>[0][]).map(toMessage));
    }, 15_000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [communityId, names, add]);

  // Stick to the newest message.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    // Optimistic: show it right away, swap in the saved one (or roll back).
    const temp: Message = { id: `temp-${Date.now()}`, user_id: userId, nickname, body, created_at: new Date().toISOString() };
    setMessages((list) => [...list, temp]);
    const saved = await sendMessage(communityId, body);
    setMessages((list) => {
      const rest = list.filter((m) => m.id !== temp.id);
      return saved && !rest.some((m) => m.id === saved.id) ? [...rest, saved] : rest;
    });
    if (!saved) {
      setDraft(body);
      toast(dict.common.error.failed, "error");
    }
  }

  const time = (iso: string) => new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const day = (iso: string) => new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));

  return (
    <div className="flex min-h-[24rem] flex-1 flex-col overflow-hidden rounded-xl border bg-card lg:max-h-[calc(100dvh-15rem)]">
      <div ref={listRef} className="flex max-h-[60dvh] flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4 lg:max-h-none" aria-live="polite">
        {messages.length === 0 && <p className="m-auto text-sm text-muted-foreground">{t.noMessages}</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const mine = m.user_id === userId;
          const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
          const showName = !mine && (newDay || prev.user_id !== m.user_id);
          return (
            <div key={m.id}>
              {newDay && <p className="my-3 text-center text-xs text-muted-foreground">{day(m.created_at)}</p>}
              <div className={cn("flex flex-col", mine ? "items-end" : "items-start", showName && "mt-2")}>
                {showName && <span className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">{m.nickname}</span>}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-[0.94rem]",
                    mine ? "rounded-ee-md bg-primary text-primary-foreground" : "rounded-es-md bg-secondary",
                    m.id.startsWith("temp-") && "opacity-60",
                  )}
                  dir="auto"
                  title={time(m.created_at)}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t p-2">
        <label htmlFor="chat-input" className="sr-only">
          {t.message}
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={draft}
          maxLength={1000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={`${t.message}…`}
          dir="auto"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-lg bg-secondary px-3 py-2 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label={t.send}
          className="press flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
        >
          <SendHorizontal size={17} className="rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
}

function CommunityBoard({ communityId }: { communityId: string }) {
  const { dict, locale } = useI18n();
  const t = dict.compare;
  const [subject, setSubject] = useState<SubjectId | null>(null);
  const state = useLoad(
    () => loadCommunityBoard(communityId, subject, CURRENT_SEMESTER),
    `community-board:${communityId}:${subject ?? "nc"}`,
  );
  const nf = intlLocale(locale);
  const format = (v: number) => (subject ? `${formatPoints(toPoints(v), nf)} P` : formatNC(ncFromScore(v), nf));
  const chips: { id: SubjectId | null; label: string }[] = [
    { id: null, label: "NC" },
    ...SUBJECT_IDS.map((id) => ({ id, label: SUBJECTS[id].label[locale] })),
  ];
  return (
    <div className="flex flex-col gap-5">
      <nav className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-1.5">
          {chips.map(({ id, label }) => (
            <button
              key={id ?? "nc"}
              type="button"
              onClick={() => setSubject(id)}
              aria-pressed={id === subject}
              className={cn(
                "press flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium",
                id === subject ? "border-transparent bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {id ? <SubjectIcon subject={id} className="size-3.5" /> : <Crown className="size-3.5" aria-hidden />}
              {label}
            </button>
          ))}
        </div>
      </nav>
      <p className="text-sm text-muted-foreground">{formatSemester(CURRENT_SEMESTER, dict)}</p>
      <Loaded state={state}>
        {(board) => (
          <Leaderboard
            board={board}
            format={format}
            extra={(n) => (n === 1 ? dict.grades.oneGrade : fill(t.gradesCount, { n }))}
            labels={{ you: t.you, average: t.average, people: t.people, empty: t.noResults }}
          />
        )}
      </Loaded>
      <p className="text-xs text-muted-foreground">{dict.communities.privacy}</p>
    </div>
  );
}

function Members({ members, creator }: { members: Member[]; creator: string }) {
  const { dict } = useI18n();
  const { userId } = useAuth();
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {members.map((m) => (
        <li key={m.user_id} className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">
            {[...m.nickname][0]}
          </span>
          <span className="flex-1 truncate font-medium">
            {m.nickname}
            {m.user_id === userId && <span className="font-normal text-muted-foreground"> ({dict.communities.you})</span>}
          </span>
          {m.user_id === creator && <Crown size={15} className="text-[var(--c-gold)]" aria-label="Admin" />}
        </li>
      ))}
    </ul>
  );
}
