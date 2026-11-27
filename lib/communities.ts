"use client";

import { isMissingTable } from "@/components/setup-notice";
import { normaliseBoard, type Board } from "@/lib/compare";
import { dataChanged, must } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { SubjectId } from "@/lib/subjects";

export type Community = { id: string; name: string; code: string; created_by: string; members: number };
export type Member = { user_id: string; nickname: string; joined_at: string };
export type Message = { id: string; user_id: string; nickname: string; body: string; created_at: string };

type Row = { id: string; name: string; code: string; created_by: string; community_members: { count: number }[] };

/** The communities you're in (empty until the communities migration is applied). */
export async function loadMyCommunities(): Promise<{ list: Community[]; missing: boolean }> {
  const { data, error } = await createClient()
    .from("communities")
    .select("id, name, code, created_by, community_members(count)")
    .order("created_at");
  if (error) {
    if (isMissingTable(error)) return { list: [], missing: true };
    throw error;
  }
  return {
    list: (data as Row[]).map(({ community_members, ...c }) => ({ ...c, members: community_members[0]?.count ?? 0 })),
    missing: false,
  };
}

type MessageRow = { id: string; user_id: string; body: string; created_at: string; profiles: { nickname: string } | null };
export const toMessage = (m: MessageRow): Message => ({
  id: m.id,
  user_id: m.user_id,
  body: m.body,
  created_at: m.created_at,
  nickname: m.profiles?.nickname ?? "?",
});
export const MESSAGE_SELECT = "id, user_id, body, created_at, profiles(nickname)";

export async function loadCommunity(id: string) {
  const supabase = createClient();
  const [community, members, messages] = await Promise.all([
    supabase.from("communities").select("id, name, code, created_by").eq("id", id).maybeSingle(),
    supabase.from("community_members").select("user_id, joined_at, profiles(nickname)").eq("community_id", id).order("joined_at"),
    supabase.from("community_messages").select(MESSAGE_SELECT).eq("community_id", id).order("created_at", { ascending: false }).limit(150),
  ]);
  const c = must(community) as Omit<Community, "members"> | null;
  if (!c) return null;
  return {
    community: c,
    members: (must(members) as unknown as { user_id: string; joined_at: string; profiles: { nickname: string } | null }[]).map((m) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      nickname: m.profiles?.nickname ?? "?",
    })),
    messages: (must(messages) as unknown as MessageRow[]).map(toMessage).reverse(),
  };
}

export async function loadCommunityBoard(id: string, subject: SubjectId | null, semester: string) {
  const board = must(
    await createClient().rpc("get_community_board", { p_community: id, p_subject: subject, p_semester: semester }),
  ) as Board;
  return normaliseBoard(board);
}

export type CommunityError = "notFound" | "full" | "failed";

export async function createCommunity(name: string): Promise<{ ok: true; id: string } | { ok: false; error: CommunityError }> {
  const { data, error } = await createClient().rpc("create_community", { p_name: name.trim() });
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true, id: (data as { id: string }).id };
}

export async function joinCommunity(code: string): Promise<{ ok: true; id: string } | { ok: false; error: CommunityError }> {
  const { data, error } = await createClient().rpc("join_community", { p_code: code.trim() });
  if (error) return { ok: false, error: error.code === "P0002" ? "notFound" : error.code === "54000" ? "full" : "failed" };
  dataChanged();
  return { ok: true, id: (data as { id: string }).id };
}

export async function leaveCommunity(id: string, userId: string) {
  const { error } = await createClient().from("community_members").delete().eq("community_id", id).eq("user_id", userId);
  if (!error) dataChanged();
  return !error;
}

export async function sendMessage(communityId: string, body: string): Promise<Message | null> {
  const { data, error } = await createClient()
    .from("community_messages")
    .insert({ community_id: communityId, body: body.trim() })
    .select(MESSAGE_SELECT)
    .single();
  return error ? null : toMessage(data as unknown as MessageRow);
}
