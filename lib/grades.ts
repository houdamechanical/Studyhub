/** The half-year everything currently belongs to. */
export const CURRENT_SEMESTER = "11.1";

/** 0–1 score (what the leaderboards return) → school points (0–15). */
export const toPoints = (score: number) => score * 15;

/**
 * NC as in the school's grade sheet (Notenrechner):
 *   NC = (17 − average points of all subjects) / 3
 * capped at 1.0 (an NC can't be better).
 */
export function ncFromPoints(points: number) {
  return Math.max(1, (17 - points) / 3);
}

/** NC straight from a 0–1 score. */
export const ncFromScore = (score: number) => ncFromPoints(toPoints(score));

/** "1,8" / "1.8" */
export function formatNC(nc: number, locale: string) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(nc);
}
