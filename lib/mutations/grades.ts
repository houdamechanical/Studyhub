import { dataChanged } from "@/lib/data";
import { cleanText, isISODate, isUuid, requireUser, type ActionResult } from "@/lib/actions";
import { isScale, SCALE_COOKIE, SCALE_RANGE, type Scale } from "@/lib/grades";
import { isSubjectId } from "@/lib/subjects";

export type GradeInput = {
  id?: string;
  subject: string;
  semester: string;
  title: string;
  scale: string;
  value: number;
  weight: number;
  graded_on: string;
};

export async function saveGrade(input: GradeInput): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };

  const value = Number(input.value);
  const weight = Number(input.weight);
  if (
    !isSubjectId(input.subject) ||
    !isScale(input.scale) ||
    !/^\d{1,2}\.[12]$/.test(input.semester) ||
    !isISODate(input.graded_on) ||
    !Number.isFinite(value) ||
    value < SCALE_RANGE[input.scale].min ||
    value > SCALE_RANGE[input.scale].max ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    weight > 100 ||
    (input.id !== undefined && !isUuid(input.id))
  ) {
    return { ok: false, error: "invalid" };
  }

  const row = {
    subject: input.subject,
    semester: input.semester,
    title: cleanText(input.title, 120),
    scale: input.scale,
    value: Math.round(value * 100) / 100,
    weight: Math.round(weight * 100) / 100,
    graded_on: input.graded_on,
  };

  const { error } = input.id
    ? await auth.supabase.from("grades").update(row).eq("id", input.id)
    : await auth.supabase.from("grades").insert(row);
  if (error) {
    console.error("saveGrade", error);
    return { ok: false, error: "failed" };
  }
  dataChanged();
  return { ok: true };
}

export async function deleteGrade(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await auth.supabase.from("grades").delete().eq("id", id);
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}

/** Remember which scale averages are shown on (per browser). */
export function setDisplayScale(scale: string) {
  if (!isScale(scale)) return;
  try {
    localStorage.setItem(SCALE_COOKIE, scale);
  } catch {
    // storage blocked (private mode): the choice just isn't remembered
  }
}

export function getDisplayScale(): Scale {
  try {
    const value = localStorage.getItem(SCALE_COOKIE);
    if (isScale(value)) return value;
  } catch {}
  return "grade";
}
