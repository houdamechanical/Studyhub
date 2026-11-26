import { dataChanged } from "@/lib/data";
import { requireUser, type ActionResult } from "@/lib/actions";
import { NICKNAME_PATTERN } from "@/lib/compare";
import { isSubjectId } from "@/lib/subjects";

export async function saveNickname(nickname: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  const nick = typeof nickname === "string" ? nickname.trim() : "";
  if (!NICKNAME_PATTERN.test(nick)) return { ok: false, error: "invalid" };

  const { error } = await auth.supabase
    .from("profiles")
    .upsert({ user_id: auth.userId, nickname: nick }, { onConflict: "user_id" });
  if (error) {
    return { ok: false, error: error.code === "23505" ? "taken" : error.code === "23514" ? "invalid" : "failed" };
  }
  dataChanged();
  return { ok: true };
}

/** Share (or stop sharing) your grades of one subject. */
export async function setGradeShare(subject: string, shared: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isSubjectId(subject)) return { ok: false, error: "invalid" };

  const { error } = shared
    ? await auth.supabase.from("grade_shares").upsert({ user_id: auth.userId, subject }, { onConflict: "user_id,subject" })
    : await auth.supabase.from("grade_shares").delete().eq("subject", subject);
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}
