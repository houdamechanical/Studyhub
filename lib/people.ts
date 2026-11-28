"use client";

import { useEffect, useState } from "react";
import { dataChanged } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

/** The app's animated avatars (drawn in components/user-avatar.tsx). */
export const AVATAR_PRESETS = ["fuchs", "katze", "panda", "frosch", "eule", "roboter", "pinguin", "alien"] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

export type Avatar = { kind: "preset"; id: AvatarPreset } | { kind: "photo"; url: string } | null;

/** profiles.avatar → what to draw. 'a:<preset>' | 'u:<https url>' | null */
export function parseAvatar(value: string | null | undefined): Avatar {
  if (!value) return null;
  if (value.startsWith("a:")) {
    const id = value.slice(2) as AvatarPreset;
    return (AVATAR_PRESETS as readonly string[]).includes(id) ? { kind: "preset", id } : null;
  }
  if (value.startsWith("u:https://")) return { kind: "photo", url: value.slice(2) };
  return null;
}

// ---------------------------------------------------------------------------
// Other people's names and pictures (profiles are readable by everyone signed in)
// ---------------------------------------------------------------------------
export type Person = { nickname: string; avatar: string | null };
const people = new Map<string, Person>();
const listeners = new Set<() => void>();
let missingColumn = false;

async function fetchPeople(ids: string[]) {
  const want = ids.filter((id) => id && !people.has(id));
  if (!want.length || missingColumn) return;
  const supabase = createClient();
  const res = await supabase.from("profiles").select("user_id, nickname, avatar").in("user_id", want);
  if (res.error) {
    missingColumn = true; // avatars migration not applied yet
    return;
  }
  for (const p of res.data as { user_id: string; nickname: string; avatar: string | null }[]) {
    people.set(p.user_id, { nickname: p.nickname, avatar: p.avatar });
  }
  listeners.forEach((l) => l());
}

/** Pictures (and names) for these users; re-renders when they arrive. */
export function usePeople(ids: (string | undefined)[]) {
  const [, bump] = useState(0);
  const key = ids.filter(Boolean).sort().join(",");
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    fetchPeople(key ? key.split(",") : []);
    return () => {
      listeners.delete(l);
    };
  }, [key]);
  return people;
}

/** Forget cached people (after changing your own picture). */
function forget(userId: string) {
  people.delete(userId);
}

// ---------------------------------------------------------------------------
// Admins (shown as "(Admin)" next to their name)
// ---------------------------------------------------------------------------
let admins: Set<string> | null = null;
let adminsLoading: Promise<void> | null = null;

export function useAdmins() {
  const [set, setSet] = useState<Set<string>>(admins ?? new Set());
  useEffect(() => {
    if (admins) return setSet(admins);
    adminsLoading ??= (async () => {
      const { data, error } = await createClient().rpc("admin_ids");
      admins = new Set(error ? [] : ((data as string[] | null) ?? []));
    })();
    let alive = true;
    adminsLoading.then(() => alive && admins && setSet(admins));
    return () => {
      alive = false;
    };
  }, []);
  return set;
}

// ---------------------------------------------------------------------------
// Changing your own picture
// ---------------------------------------------------------------------------
type Result = { ok: true; value: string | null } | { ok: false; error: "failed" | "tooBig" | "notImage" };

export async function setAvatarValue(userId: string, value: string | null): Promise<Result> {
  const { error } = await createClient().from("profiles").update({ avatar: value }).eq("user_id", userId);
  if (error) return { ok: false, error: "failed" };
  forget(userId);
  dataChanged();
  return { ok: true, value };
}

/** Shrink a photo to a 320 px square (centre crop) before uploading. */
async function squareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 320;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 320, 320);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (blob && blob.type === "image/webp") return blob;
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.88));
}

export async function uploadAvatar(userId: string, file: File): Promise<Result> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "notImage" };
  if (file.size > 15 * 1024 * 1024) return { ok: false, error: "tooBig" };
  let blob: Blob;
  try {
    blob = await squareImage(file);
  } catch {
    return { ok: false, error: "notImage" };
  }
  const supabase = createClient();
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const up = await supabase.storage.from("avatars").upload(path, blob, { contentType: blob.type, upsert: false });
  if (up.error) return { ok: false, error: "failed" };
  // Remove older pictures of this user (best effort).
  const list = await supabase.storage.from("avatars").list(userId);
  const old = (list.data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path);
  if (old.length) await supabase.storage.from("avatars").remove(old);
  const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  return setAvatarValue(userId, `u:${url}`);
}
