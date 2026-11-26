"use server";

import { revalidatePath } from "next/cache";
import { cleanText, isISODate, isUuid, requireUser, type ActionResult } from "@/lib/actions";
import { EXAM_STATUSES, EXAM_TYPES, type ExamStatus, type ExamType } from "@/lib/exams";
import { isSubjectId } from "@/lib/subjects";

export type ExamInput = {
  id?: string;
  subject: string;
  title: string;
  type: string;
  exam_date: string;
  start_time: string;
  room: string;
  status: string;
  notes: string;
};

export async function saveExam(input: ExamInput): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };

  const startTime = input.start_time?.trim() ?? "";
  if (
    !isSubjectId(input.subject) ||
    !(EXAM_TYPES as readonly string[]).includes(input.type) ||
    !(EXAM_STATUSES as readonly string[]).includes(input.status) ||
    !isISODate(input.exam_date) ||
    (startTime !== "" && !/^\d{2}:\d{2}$/.test(startTime)) ||
    (input.id !== undefined && !isUuid(input.id))
  ) {
    return { ok: false, error: "invalid" };
  }

  const row = {
    subject: input.subject,
    title: cleanText(input.title, 120),
    type: input.type as ExamType,
    exam_date: input.exam_date,
    start_time: startTime || null,
    room: cleanText(input.room, 60),
    status: input.status as ExamStatus,
    notes: cleanText(input.notes, 1000),
  };

  const { error } = input.id
    ? await auth.supabase.from("exams").update(row).eq("id", input.id)
    : await auth.supabase.from("exams").insert(row);
  if (error) {
    console.error("saveExam", error);
    return { ok: false, error: "failed" };
  }
  revalidatePath("/exams");
  return { ok: true };
}

export async function setExamStatus(id: string, status: ExamStatus): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(id) || !(EXAM_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "invalid" };
  }
  const { error } = await auth.supabase.from("exams").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "failed" };
  revalidatePath("/exams");
  return { ok: true };
}

export async function deleteExam(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await auth.supabase.from("exams").delete().eq("id", id);
  if (error) return { ok: false, error: "failed" };
  revalidatePath("/exams");
  return { ok: true };
}
