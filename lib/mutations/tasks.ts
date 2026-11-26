import { cleanText, isISODate, isUuid, requireUser, type ActionResult } from "@/lib/actions";
import { dataChanged } from "@/lib/data";
import { isSubjectId } from "@/lib/subjects";

/** Add a task for `day` (the browser's local date, YYYY-MM-DD). */
export async function addTask(title: string, day: string, subject: string | null = null): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  const text = cleanText(title, 200);
  if (!text || !isISODate(day) || (subject !== null && !isSubjectId(subject))) return { ok: false, error: "invalid" };
  const { error } = await auth.supabase.from("tasks").insert({ title: text, due_on: day, subject });
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}

export async function setTaskDone(id: string, done: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await auth.supabase
    .from("tasks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await auth.supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}
