import { dataChanged } from "@/lib/data";
import { isISODate, isUuid, requireUser, type ActionError } from "@/lib/actions";
import { todayISO } from "@/lib/format";
import { addDays, RATINGS, sm2, type GivenAnswer, type Rating } from "@/lib/practice";

type Result<T> = ({ ok: true } & T) | { ok: false; error: ActionError };

export async function startAttempt(
  quizId: string,
  timed: boolean,
): Promise<Result<{ attemptId: string; deadline: string | null }>> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(quizId)) return { ok: false, error: "invalid" };

  const { data, error } = await auth.supabase.rpc("start_attempt", { p_quiz_id: quizId, p_timed: Boolean(timed) });
  if (error || !data) {
    console.error("start_attempt", error);
    return { ok: false, error: "failed" };
  }
  return { ok: true, attemptId: data.id, deadline: data.deadline };
}

export async function submitAttempt(
  attemptId: string,
  answers: Record<string, GivenAnswer>,
): Promise<Result<{ attemptId: string }>> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(attemptId) || typeof answers !== "object" || answers === null) return { ok: false, error: "invalid" };

  // Keep only well-formed answers; grading happens in the database.
  const clean: Record<string, GivenAnswer> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (!isUuid(id)) continue;
    if (typeof value === "number" && Number.isInteger(value)) clean[id] = value;
    else if (Array.isArray(value) && value.length <= 50 && value.every((v) => Number.isInteger(v))) clean[id] = value;
    else if (typeof value === "string" && value.trim()) clean[id] = value.slice(0, 500);
  }

  const { error } = await auth.supabase.rpc("submit_attempt", { p_attempt_id: attemptId, p_answers: clean });
  if (error) {
    console.error("submit_attempt", error);
    return { ok: false, error: "failed" };
  }
  dataChanged();
  return { ok: true, attemptId };
}

/** Rate a flashcard and schedule it with SM-2 (due date in the user's local calendar). */
export async function reviewCard(
  cardId: string,
  rating: Rating,
  clientToday: string,
): Promise<Result<{ dueOn: string; intervalDays: number }>> {
  const auth = await requireUser();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!isUuid(cardId) || !(RATINGS as readonly string[]).includes(rating)) return { ok: false, error: "invalid" };

  const today = isISODate(clientToday) ? clientToday : todayISO();

  const { data: prev } = await auth.supabase
    .from("card_reviews")
    .select("ease, interval_days, repetitions")
    .eq("card_id", cardId)
    .maybeSingle();

  const next = sm2(prev ? { ...prev, ease: Number(prev.ease) } : null, rating);
  const dueOn = addDays(today, next.interval_days);

  const { error } = await auth.supabase.from("card_reviews").upsert({
    user_id: auth.userId,
    card_id: cardId,
    ...next,
    due_on: dueOn,
    last_reviewed_at: new Date().toISOString(),
  });
  if (error) {
    console.error("reviewCard", error);
    return { ok: false, error: "failed" };
  }
  return { ok: true, dueOn, intervalDays: next.interval_days };
}
