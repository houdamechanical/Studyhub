"use client";

import type { AwardState } from "@/lib/awards";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/** Gold medallion for an earned award; a dim outline with progress while locked. */
function Medallion({ award }: { award: AwardState }) {
  const { dict } = useI18n();
  const text = dict.awards[award.id];
  const Icon = award.icon;
  const pct = award.value / award.target;
  return (
    <li className="flex flex-col items-center text-center" title={`${text.name} – ${text.desc}`}>
      <span
        className={cn(
          "relative flex size-16 items-center justify-center rounded-full transition-colors duration-300",
          award.earned ? "text-[#1c1a17]" : "border border-dashed text-muted-foreground",
        )}
        style={
          award.earned
            ? {
                background: "radial-gradient(circle at 35% 30%, #e6cb98, #c9a46a 45%, #8e7044 100%)",
                boxShadow: "0 0 0 1px rgb(230 203 152 / 0.35), 0 8px 24px -8px rgb(201 164 106 / 0.45)",
              }
            : undefined
        }
      >
        {/* progress ring while locked */}
        {!award.earned && pct > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="31" fill="none" stroke="var(--c-amber)" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray={`${pct * 194.8} 194.8`} />
          </svg>
        )}
        <Icon size={24} strokeWidth={1.75} />
      </span>
      <span className={cn("mt-2.5 text-sm font-medium", !award.earned && "text-muted-foreground")}>{text.name}</span>
      <span className="mt-0.5 text-xs leading-snug text-muted-foreground">
        {award.earned ? text.desc : `${award.value}/${award.target}`}
      </span>
    </li>
  );
}

export function AwardsSection({ awards }: { awards: AwardState[] | null }) {
  const { dict } = useI18n();
  const earned = awards?.filter((a) => a.earned).length ?? 0;
  // Earned first, then the closest to unlocking.
  const sorted = awards ? [...awards].sort((a, b) => Number(b.earned) - Number(a.earned) || b.value / b.target - a.value / a.target) : [];
  return (
    <section className="hairline pt-6">
      <div className="mb-6 flex items-baseline justify-between gap-2">
        <h2 className="eyebrow">{dict.awards.title}</h2>
        {awards && <span className="text-sm text-muted-foreground">{fill(dict.awards.earned, { a: earned, n: awards.length })}</span>}
      </div>
      {awards === null ? (
        <div className="h-28 animate-pulse rounded-xl bg-secondary" />
      ) : (
        <ul className="grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-5 lg:grid-cols-9">
          {sorted.map((a) => (
            <Medallion key={a.id} award={a} />
          ))}
        </ul>
      )}
    </section>
  );
}
