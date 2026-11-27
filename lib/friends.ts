"use client";

import { normaliseBoard, type Board } from "@/lib/compare";
import { dataChanged, must } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

/** How the signed-in student relates to someone. */
export type Relation = "self" | "friends" | "outgoing" | "incoming" | "none";

/** A student's public profile (get_player_stats). Grades are never part of it. */
export type PlayerStats = {
  user_id: string;
  nickname: string;
  joined: string;
  relation: Relation;
  friends: number;
  /** Sum over mini tests of the best result in percent. */
  xp: number;
  /** Different mini tests finished. */
  tests_done: number;
  subjects: number;
  /** Average best result over finished mini tests, 0–1. */
  best_avg: number | null;
  /** Finished mini-test attempts (in time). */
  attempts: number;
  /** Attempts with full points. */
  perfect: number;
  /** Different days with a finished mini test. */
  days: number;
};

export type Friend = { user_id: string; nickname: string; relation: "friends" | "incoming" | "outgoing" };
export type Player = { user_id: string; nickname: string };

/** The friends migration isn't applied yet (missing function or table). */
const isMissing = (code?: string) => code === "PGRST202" || code === "42883" || code === "42P01" || code === "PGRST205";

export async function loadProfile(userId: string): Promise<{ missing: boolean; stats: PlayerStats | null }> {
  const { data, error } = await createClient().rpc("get_player_stats", { p_user: userId });
  if (error) {
    if (isMissing(error.code)) return { missing: true, stats: null };
    throw error;
  }
  if (!data) return { missing: false, stats: null };
  const d = data as Record<string, unknown>;
  const n = (v: unknown) => Number(v ?? 0);
  return {
    missing: false,
    stats: {
      ...(d as unknown as PlayerStats),
      friends: n(d.friends),
      xp: n(d.xp),
      tests_done: n(d.tests_done),
      subjects: n(d.subjects),
      best_avg: d.best_avg === null || d.best_avg === undefined ? null : Number(d.best_avg),
      attempts: n(d.attempts),
      perfect: n(d.perfect),
      days: n(d.days),
    },
  };
}

/** Your friends and open requests, alphabetically. */
export async function loadFriends(me: string): Promise<{ missing: boolean; list: Friend[] }> {
  const supabase = createClient();
  const rows = await supabase.from("friendships").select("requester, addressee, status");
  if (rows.error) {
    if (isMissing(rows.error.code)) return { missing: true, list: [] };
    throw rows.error;
  }
  const data = rows.data as { requester: string; addressee: string; status: string }[];
  const other = (r: (typeof data)[number]) => (r.requester === me ? r.addressee : r.requester);
  const ids = data.map(other);
  const names = ids.length
    ? (must(await supabase.from("profiles").select("user_id, nickname").in("user_id", ids)) as Player[])
    : [];
  const nick = new Map(names.map((p) => [p.user_id, p.nickname]));
  const list: Friend[] = data
    .filter((r) => nick.has(other(r)))
    .map((r) => ({
      user_id: other(r),
      nickname: nick.get(other(r))!,
      relation: r.status === "accepted" ? "friends" : r.requester === me ? "outgoing" : "incoming",
    }));
  list.sort((a, b) => a.nickname.localeCompare(b.nickname));
  return { missing: false, list };
}

/** Students whose name contains the text (not you). */
export async function searchPlayers(text: string, me: string): Promise<Player[]> {
  const q = text.trim().replace(/[%_,()\\]/g, "");
  if (q.length < 2) return [];
  const { data, error } = await createClient()
    .from("profiles")
    .select("user_id, nickname")
    .ilike("nickname", `%${q}%`)
    .neq("user_id", me)
    .order("nickname")
    .limit(8);
  if (error) throw error;
  return data as Player[];
}

type Result = { ok: true } | { ok: false };

/** Send a request (or accept theirs, if they already asked). */
export async function addFriend(userId: string): Promise<Result> {
  const { error } = await createClient().rpc("add_friend", { p_user: userId });
  if (error) return { ok: false };
  dataChanged();
  return { ok: true };
}

/** Accept a request someone sent you. */
export async function acceptFriend(userId: string, me: string): Promise<Result> {
  const { error } = await createClient()
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester", userId)
    .eq("addressee", me);
  if (error) return { ok: false };
  dataChanged();
  return { ok: true };
}

/** Decline, cancel or end a friendship (either direction). */
export async function removeFriend(userId: string, me: string): Promise<Result> {
  const { error } = await createClient()
    .from("friendships")
    .delete()
    .or(`and(requester.eq.${me},addressee.eq.${userId}),and(requester.eq.${userId},addressee.eq.${me})`);
  if (error) return { ok: false };
  dataChanged();
  return { ok: true };
}

/** XP leaderboard from mini tests: everyone, or you and your friends. */
export async function loadMiniBoard(friendsOnly: boolean): Promise<{ missing: boolean; board: Board }> {
  const { data, error } = await createClient().rpc("get_mini_board", { p_friends: friendsOnly });
  const empty: Board = { participants: 0, average: null, mine: null, rows: [] };
  if (error) {
    if (isMissing(error.code)) return { missing: true, board: empty };
    throw error;
  }
  return { missing: false, board: normaliseBoard((data as Board) ?? empty) };
}

// ---------------------------------------------------------------------------
// Achievements: earned from mini tests (and one for having a friend)
// ---------------------------------------------------------------------------
export type AchievementId =
  | "first"
  | "five"
  | "twentyFive"
  | "perfect"
  | "perfectFive"
  | "allrounder"
  | "streak"
  | "xp500"
  | "friend";

export const ACHIEVEMENTS: { id: AchievementId; value: (s: PlayerStats) => number; goal: number }[] = [
  { id: "first", value: (s) => s.attempts, goal: 1 },
  { id: "five", value: (s) => s.attempts, goal: 5 },
  { id: "twentyFive", value: (s) => s.attempts, goal: 25 },
  { id: "perfect", value: (s) => s.perfect, goal: 1 },
  { id: "perfectFive", value: (s) => s.perfect, goal: 5 },
  { id: "allrounder", value: (s) => s.subjects, goal: 3 },
  { id: "streak", value: (s) => s.days, goal: 5 },
  { id: "xp500", value: (s) => s.xp, goal: 500 },
  { id: "friend", value: (s) => s.friends, goal: 1 },
];

// ---------------------------------------------------------------------------
// Friends list with XP and (if they share with you) their NC
// ---------------------------------------------------------------------------
export type FriendRow = {
  user_id: string;
  nickname: string;
  xp: number;
  tests: number;
  /** They let you see their grades. */
  they_share: boolean;
  /** You let them see yours. */
  i_share: boolean;
  /** Average points / 15 this half-year; null when not shared (or no grades yet). */
  score: number | null;
};

export async function loadFriendRows(semester: string): Promise<{ missing: boolean; list: FriendRow[] }> {
  const { data, error } = await createClient().rpc("get_friends", { p_semester: semester });
  if (error) {
    if (isMissing(error.code)) return { missing: true, list: [] };
    throw error;
  }
  const list = ((data as FriendRow[] | null) ?? []).map((f) => ({
    ...f,
    xp: Number(f.xp ?? 0),
    tests: Number(f.tests ?? 0),
    score: f.score === null || f.score === undefined ? null : Number(f.score),
  }));
  return { missing: false, list };
}

/** Let one friend see your grades (NC and subject averages), or stop. */
export async function setFriendShare(friendId: string, me: string, on: boolean): Promise<Result> {
  const supabase = createClient();
  const { error } = on
    ? await supabase
        .from("friend_grade_shares")
        .upsert({ owner: me, viewer: friendId }, { onConflict: "owner,viewer", ignoreDuplicates: true })
    : await supabase.from("friend_grade_shares").delete().eq("owner", me).eq("viewer", friendId);
  if (error) return { ok: false };
  dataChanged();
  return { ok: true };
}
