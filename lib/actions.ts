import { createClient } from "@/lib/supabase/client";

export type ActionError = "unauthorized" | "invalid" | "failed" | "taken";
export type ActionResult = { ok: true } | { ok: false; error: ActionError };

/**
 * Browser Supabase client + signed-in user id, or null if not signed in.
 * Every write is still checked by Row Level Security in the database.
 */
export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? { supabase, userId } : null;
}

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const isISODate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export const cleanText = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
