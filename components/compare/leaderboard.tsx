import { Crown, Flag } from "lucide-react";
import type { Board } from "@/lib/compare";
import { cn } from "@/lib/utils";

type Labels = { you: string; average: string; people: string; empty: string };

/** Ranked list (works in server and client components). Values are pre-formatted by the caller. */
export function Leaderboard({
  board,
  format,
  extra,
  labels,
  note,
}: {
  board: Board;
  format: (value: number) => string;
  extra?: (n: number) => string;
  labels: Labels;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat
          label={labels.you}
          value={board.mine === null ? "–" : format(board.mine)}
          dot="accent"
        />
        <Stat
          label={labels.average}
          value={board.average === null ? "–" : format(board.average)}
          dot="muted"
        />
        <Stat label={labels.people} value={String(board.participants)} />
      </dl>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {board.rows.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed p-6 text-center font-medium text-muted-foreground">
          <Flag className="mx-auto mb-2 size-8 text-muted-foreground/70" strokeWidth={2} aria-hidden />
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
            <ol className="divide-y rounded-3xl border bg-card">
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
                      <bdi>{row.nickname}</bdi>
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

function Stat({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot?: "accent" | "muted";
}) {
  return (
    <div className="rounded-2xl border bg-card px-2 py-3">
      <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        {dot && (
          <span
            className={cn(
              "size-2 rounded-full",
              dot === "accent"
                ? "bg-[var(--chart-accent)]"
                : "bg-[var(--chart-muted)]",
            )}
            aria-hidden
          />
        )}
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-xl font-extrabold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

const MEDAL = [
  {
    bg: "linear-gradient(135deg, #fde047, #f59e0b)",
    height: "h-28 sm:h-32",
  },
  {
    bg: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
    height: "h-20 sm:h-24",
  },
  {
    bg: "linear-gradient(135deg, #fdba74, #c2410c)",
    height: "h-14 sm:h-16",
  },
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
                "relative flex items-center justify-center rounded-full font-display font-extrabold uppercase text-white shadow-lg ring-4 ring-background",
                row.rank === 1
                  ? "size-16 text-2xl sm:size-20 sm:text-3xl"
                  : "size-12 text-lg sm:size-14 sm:text-xl",
              )}
              style={{ backgroundImage: MEDAL[Math.min(row.rank, 3) - 1].bg }}
            >
              {row.nickname.slice(0, 1)}
              {row.rank === 1 && (
                <Crown
                  className="absolute -top-6 size-7 fill-amber-300 text-amber-500 drop-shadow motion-safe:animate-float sm:-top-7 sm:size-8"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
            </span>
            <span
              className={cn(
                "mt-2 w-full truncate text-sm font-bold",
                row.is_me && "text-primary",
              )}
            >
              <bdi>{row.nickname}</bdi>
              {row.is_me && (
                <span className="block text-xs font-medium text-muted-foreground">
                  ({you})
                </span>
              )}
            </span>
            <span className="font-display text-lg font-extrabold tabular-nums">
              {format(row.value)}
            </span>
            <span
              className={cn(
                "mt-2 flex w-full items-start justify-center rounded-t-2xl pt-2 text-2xl shadow-inner",
                MEDAL[Math.min(row.rank, 3) - 1].height,
              )}
              style={{ backgroundImage: MEDAL[Math.min(row.rank, 3) - 1].bg }}
              aria-label={`#${row.rank}`}
            >
              <span className="font-display text-3xl font-extrabold text-white/90 drop-shadow-sm">{row.rank}</span>
            </span>
          </li>
        ) : (
          <li key={`empty-${i}`} aria-hidden />
        ),
      )}
    </ol>
  );
}
