/** Same rule as the database check: 3–20 letters (Latin, umlauts, Arabic), digits, _ . - */
export const NICKNAME_PATTERN = /^[A-Za-z0-9ÄÖÜäöüß_.\-ء-ي٠-٩]{3,20}$/;

export type BoardRow = { rank: number; nickname: string; value: number; extra: number; is_me: boolean; user_id?: string };

/** What get_quiz_board / get_subject_board return for one leaderboard. Values are 0–1. */
export type Board = {
  participants: number;
  average: number | null;
  mine: number | null;
  rows: BoardRow[];
};

/** What get_grade_board returns: the ranking plus your own average (only you see it). */
export type GradeBoard = { board: Board; my_score: number | null };

/** Postgres numerics arrive as strings or numbers; normalise a board. */
export function normaliseBoard(b: Board): Board {
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    participants: Number(b?.participants ?? 0),
    average: n(b?.average),
    mine: n(b?.mine),
    rows: (b?.rows ?? []).map((r) => ({ ...r, value: Number(r.value), rank: Number(r.rank), extra: Number(r.extra) })),
  };
}
