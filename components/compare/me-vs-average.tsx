import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { QuizComparison } from "@/lib/compare";

const pct = (v: number) => `${Math.round(v * 100)} %`;

/**
 * Dot plot per test on a shared 0–100 % axis: you (accent) vs. the average (gray).
 * One legend for the whole list; every value is also written out as text.
 */
export function MeVsAverage({
  quizzes,
  labels,
}: {
  quizzes: QuizComparison[];
  labels: { you: string; average: string; notTaken: string; people: (n: number) => string };
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[var(--chart-accent)]" />
          {labels.you}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[var(--chart-muted)]" />
          {labels.average}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {quizzes.map((q) => (
          <li key={q.id}>
            <Link href={`/compare/quiz?id=${q.id}`} className="group block rounded-3xl border bg-card p-3 transition-colors hover:bg-accent">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium" dir="auto">
                  {q.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {labels.you} {q.mine === null ? labels.notTaken : pct(q.mine)} · Ø {q.average === null ? "–" : pct(q.average)}
                </span>
                <ChevronRight size={16} className="shrink-0 text-muted-foreground rtl:rotate-180" />
              </div>
              {/* Track; the axis runs left → right in every language */}
              <div className="relative mt-3 mb-1 h-3" dir="ltr" aria-hidden>
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                {q.mine !== null && q.average !== null && (
                  <div
                    className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-muted-foreground/40"
                    style={{
                      left: `${Math.min(q.mine, q.average) * 100}%`,
                      width: `${Math.abs(q.mine - q.average) * 100}%`,
                    }}
                  />
                )}
                {q.average !== null && <Dot value={q.average} className="bg-[var(--chart-muted)]" />}
                {q.mine !== null && <Dot value={q.mine} className="bg-[var(--chart-accent)]" />}
              </div>
              <p className="text-[11px] text-muted-foreground">{labels.people(q.participants)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dot({ value, className }: { value: number; className: string }) {
  return (
    <span
      className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${className}`}
      style={{ left: `${value * 100}%` }}
    />
  );
}
