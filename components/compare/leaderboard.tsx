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
        <Stat label={labels.you} value={board.mine === null ? "–" : format(board.mine)} dot="accent" />
        <Stat label={labels.average} value={board.average === null ? "–" : format(board.average)} dot="muted" />
        <Stat label={labels.people} value={String(board.participants)} />
      </dl>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {board.rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <ol className="divide-y rounded-xl border bg-card">
          {board.rows.map((row) => (
            <li
              key={`${row.rank}-${row.nickname}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm",
                row.is_me && "bg-[color-mix(in_srgb,var(--chart-accent)_12%,transparent)] font-medium",
              )}
            >
              <span
                className={cn(
                  "w-7 shrink-0 text-center tabular-nums",
                  row.rank <= 3 ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : row.rank}
              </span>
              <span className="min-w-0 flex-1 truncate">
                <bdi>{row.nickname}</bdi>
                {row.is_me && <span className="ms-1.5 text-xs font-normal text-muted-foreground">({labels.you})</span>}
              </span>
              {extra && <span className="shrink-0 text-xs text-muted-foreground">{extra(row.extra)}</span>}
              <span className="w-16 shrink-0 text-end font-semibold tabular-nums">{format(row.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: string; dot?: "accent" | "muted" }) {
  return (
    <div className="rounded-lg border bg-card px-2 py-2.5">
      <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        {dot && (
          <span
            className={cn("size-2 rounded-full", dot === "accent" ? "bg-[var(--chart-accent)]" : "bg-[var(--chart-muted)]")}
            aria-hidden
          />
        )}
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
