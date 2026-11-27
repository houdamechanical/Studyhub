import { Crown, Flag } from "lucide-react";
import Link from "next/link";
import type { Board, BoardRow } from "@/lib/compare";
import { cn } from "@/lib/utils";

type Labels = { you: string; average: string; people: string; empty: string };

/** Ranked list (works in server and client components). Values are pre-formatted by the caller. */
export function Leaderboard({
  board,
  format,
  extra,
  labels,
}: {
  board: Board;
  format: (value: number) => string;
  extra?: (n: number) => string;
  labels: Labels;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* One quiet summary line instead of three stat boxes */}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          {labels.you}: <span className="font-semibold text-foreground tabular-nums">{board.mine === null ? "–" : format(board.mine)}</span>
        </span>
        <span>
          {labels.average}: <span className="font-semibold text-foreground tabular-nums">{board.average === null ? "–" : format(board.average)}</span>
        </span>
        <span>
          {labels.people}: <span className="font-semibold text-foreground tabular-nums">{board.participants}</span>
        </span>
      </p>
      
      {board.rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <Flag className="mx-auto mb-2 size-5 text-muted-foreground" strokeWidth={2} aria-hidden />
          {labels.empty}
        </p>
      ) : (
        <>
          <Podium
            rows={board.rows.filter((r) => r.rank <= 3).slice(0, 3)}
            format={format}
            you={labels.you}
          />
          {board.rows.some((r) => r.rank > 3) && (
            <ol className="divide-y rounded-xl border bg-card shadow-card">
              {board.rows
                .filter((r) => r.rank > 3)
                .map((row) => (
                  <li
                    key={`${row.rank}-${row.nickname}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm",
                      row.is_me &&
                        "bg-[color-mix(in_srgb,var(--chart-accent)_12%,transparent)] font-medium",
                    )}
                  >
                    <span
                      className={cn(
                        "w-7 shrink-0 text-center tabular-nums",
                        row.rank <= 3
                          ? "font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {row.rank <= 3
                        ? ["🥇", "🥈", "🥉"][row.rank - 1]
                        : row.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <Name row={row} />
                      {row.is_me && (
                        <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                          ({labels.you})
                        </span>
                      )}
                    </span>
                    {extra && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {extra(row.extra)}
                      </span>
                    )}
                    <span className="w-16 shrink-0 text-end font-semibold tabular-nums">
                      {format(row.value)}
                    </span>
                  </li>
                ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}


// Neutral podium; only first place gets the accent colour.
const MEDAL = [
  { block: "h-24 sm:h-28 border-primary/40 bg-primary/15", avatar: "bg-primary text-primary-foreground" },
  { block: "h-16 sm:h-20 bg-secondary", avatar: "bg-[var(--c-pill)] text-foreground" },
  { block: "h-12 sm:h-14 bg-secondary", avatar: "bg-[var(--c-pill)] text-foreground" },
];

/** Top three on a podium: 2nd – 1st – 3rd. */
function Podium({
  rows,
  format,
  you,
}: {
  rows: Board["rows"];
  format: (v: number) => string;
  you: string;
}) {
  if (rows.length === 0) return null;
  const order = [rows[1], rows[0], rows[2]];
  return (
    <ol className="mx-auto grid w-full max-w-xl grid-cols-3 items-end gap-2 px-1 pt-4 sm:gap-4">
      {order.map((row, i) =>
        row ? (
          <li
            key={`${row.rank}-${row.nickname}`}
            className="enter flex min-w-0 flex-col items-center text-center"
            style={{ animationDelay: `${[90, 0, 170][i]}ms` }}
          >
            <span
              className={cn(
                "relative flex items-center justify-center rounded-full font-display font-semibold uppercase",
                MEDAL[Math.min(row.rank, 3) - 1].avatar,
                row.rank === 1
                  ? "size-16 text-2xl sm:size-20 sm:text-3xl"
                  : "size-12 text-lg sm:size-14 sm:text-xl",
              )}
            >
              {row.nickname.slice(0, 1)}
              {row.rank === 1 && (
                <Crown
                  className="absolute -top-5 size-5 text-[var(--c-amber)] sm:-top-6 sm:size-6"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
            </span>
            <span
              className={cn(
                "mt-2 w-full truncate text-sm font-medium",
                row.is_me && "text-[var(--c-amber)]",
              )}
            >
              <Name row={row} />
              {row.is_me && (
                <span className="block text-xs font-medium text-muted-foreground">
                  ({you})
                </span>
              )}
            </span>
            <span className="font-display text-lg font-semibold tabular-nums">
              {format(row.value)}
            </span>
            <span
              className={cn(
                "mt-2 flex w-full items-start justify-center rounded-t-xl border border-b-0 pt-2",
                MEDAL[Math.min(row.rank, 3) - 1].block,
              )}
              aria-label={`#${row.rank}`}
            >
              <span className="font-display text-lg font-semibold text-muted-foreground">{row.rank}</span>
            </span>
          </li>
        ) : (
          <li key={`empty-${i}`} aria-hidden />
        ),
      )}
    </ol>
  );
}

/** A name that opens the student's profile (when the board knows who it is). */
function Name({ row }: { row: BoardRow }) {
  if (!row.user_id) return <bdi>{row.nickname}</bdi>;
  return (
    <Link href={`/profile?id=${row.user_id}`} className="underline-offset-4 hover:underline">
      <bdi>{row.nickname}</bdi>
    </Link>
  );
}
