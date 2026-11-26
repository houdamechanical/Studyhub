"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatOnScale, formatScore, fromScore, toScore, type Scale, type TimelinePoint } from "@/lib/grades";
import { formatDate, intlLocale } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECTS } from "@/lib/subjects";

const HEIGHT = 220;
const M = { top: 14, right: 52, bottom: 26, left: 40 };
const DAY = 86_400_000;

const TICKS: Record<Scale, number[]> = {
  grade: [1, 2, 3, 4, 5, 6],
  points: [0, 5, 10, 15],
  percent: [0, 25, 50, 75, 100],
};

const time = (date: string) => new Date(`${date}T00:00:00`).getTime();

/**
 * Line = running average (accent), dots = single grades (gray).
 * Better is always up: grade 1.0, 15 points and 100 % sit at the top.
 */
export function GradeChart({ points, scale }: { points: TimelinePoint[]; scale: Scale }) {
  const { locale, dict } = useI18n();
  const nf = intlLocale(locale);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const geo = useMemo(() => {
    const times = points.map((p) => time(p.grade.graded_on));
    let t0 = Math.min(...times);
    let t1 = Math.max(...times);
    if (t1 - t0 < 7 * DAY) {
      const mid = (t0 + t1) / 2;
      t0 = mid - 3.5 * DAY;
      t1 = mid + 3.5 * DAY;
    }
    const plotW = width - M.left - M.right;
    const plotH = HEIGHT - M.top - M.bottom;
    const x = (t: number) => M.left + ((t - t0) / (t1 - t0)) * plotW;
    const y = (score: number) => M.top + (1 - score) * plotH;
    return {
      x,
      y,
      t0,
      t1,
      plotW,
      plotH,
      xs: times.map(x),
      line: points.map((p, i) => `${i ? "L" : "M"}${x(times[i]).toFixed(1)},${y(p.runningScore).toFixed(1)}`).join(""),
    };
  }, [points, width]);

  if (points.length === 0) return null;

  const last = points[points.length - 1];
  const lastX = geo.xs[geo.xs.length - 1];
  const xTicks = [geo.t0, (geo.t0 + geo.t1) / 2, geo.t1];
  const shortDate = (t: number) =>
    new Intl.DateTimeFormat(nf, { day: "numeric", month: "short" }).format(new Date(t));

  function onPointer(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    for (let i = 1; i < geo.xs.length; i++) {
      if (Math.abs(geo.xs[i] - px) <= Math.abs(geo.xs[best] - px)) best = i;
    }
    setHover(best);
  }

  const h = hover !== null ? points[hover] : null;
  const hx = hover !== null ? geo.xs[hover] : 0;

  return (
    // Time runs left → right in every language, so the chart itself stays LTR.
    <div ref={wrapRef} className="relative w-full select-none overflow-hidden" dir="ltr">
      <svg width={width} height={HEIGHT} role="img" aria-label={dict.grades.chartTitle} className="block">
        {/* Gridlines + y labels */}
        {TICKS[scale].map((v) => {
          const yy = geo.y(toScore(scale, v));
          return (
            <g key={v}>
              <line x1={M.left} x2={width - M.right} y1={yy} y2={yy} stroke="hsl(var(--border))" strokeWidth={1} />
              <text x={M.left - 8} y={yy} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {new Intl.NumberFormat(nf).format(v)}
              </text>
            </g>
          );
        })}
        {/* x labels */}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={geo.x(t)}
            y={HEIGHT - 6}
            textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
            className="fill-muted-foreground text-[11px]"
          >
            {shortDate(t)}
          </text>
        ))}

        {/* Crosshair */}
        {h && <line x1={hx} x2={hx} y1={M.top} y2={HEIGHT - M.bottom} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />}

        {/* Running average line */}
        <path d={geo.line} fill="none" stroke="var(--chart-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Single grades */}
        {points.map((p, i) => (
          <circle
            key={p.grade.id}
            cx={geo.xs[i]}
            cy={geo.y(p.score)}
            r={hover === i ? 5.5 : 4}
            fill="var(--chart-muted)"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          />
        ))}

        {/* Hovered running-average point, end point + end label */}
        {h && (
          <circle cx={hx} cy={geo.y(h.runningScore)} r={5} fill="var(--chart-accent)" stroke="hsl(var(--card))" strokeWidth={2} />
        )}
        <circle cx={lastX} cy={geo.y(last.runningScore)} r={4.5} fill="var(--chart-accent)" stroke="hsl(var(--card))" strokeWidth={2} />
        <text x={lastX + 9} y={geo.y(last.runningScore)} dy="0.32em" className="fill-foreground text-xs font-semibold tabular-nums">
          {formatScore(last.runningScore, scale, nf)}
        </text>

        {/* Hit area (bigger than the marks) */}
        <rect
          x={M.left - 12}
          y={0}
          width={geo.plotW + 24}
          height={HEIGHT}
          fill="transparent"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {h && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-48 rounded-lg border bg-popover p-2.5 text-xs shadow-md"
          style={{ left: Math.min(Math.max(hx - 96, 0), width - 192) }}
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <p className="text-muted-foreground">{formatDate(h.grade.graded_on, locale)}</p>
          <p className="mt-0.5 font-medium">
            {SUBJECTS[h.grade.subject].emoji} {SUBJECTS[h.grade.subject].label[locale]}
            {h.grade.title && <span className="font-normal"> · {h.grade.title}</span>}
          </p>
          <p className="mt-1.5 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--chart-muted)]" />
              {dict.grades.value}
            </span>
            <span className="font-semibold tabular-nums">
              {formatOnScale(h.grade.scale, h.grade.value, nf)}
              {h.grade.scale !== scale && (
                <span className="font-normal text-muted-foreground"> ({formatOnScale(scale, fromScore(scale, h.score), nf, true)})</span>
              )}
            </span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded bg-[var(--chart-accent)]" />
              {dict.grades.runningAverage}
            </span>
            <span className="font-semibold tabular-nums">{formatScore(h.runningScore, scale, nf)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/** Same data as the chart, as a table (accessible alternative). */
export function GradeTable({ points, scale }: { points: TimelinePoint[]; scale: Scale }) {
  const { locale, dict } = useI18n();
  const nf = intlLocale(locale);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 pe-3 text-start font-medium">{dict.grades.date}</th>
            <th className="py-2 pe-3 text-start font-medium">{dict.grades.subject}</th>
            <th className="py-2 pe-3 text-end font-medium">{dict.grades.value}</th>
            <th className="py-2 text-end font-medium">{dict.grades.runningAverage}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.grade.id} className="border-b last:border-0">
              <td className="py-2 pe-3 whitespace-nowrap">{formatDate(p.grade.graded_on, locale, { day: "numeric", month: "short" })}</td>
              <td className="py-2 pe-3">
                {SUBJECTS[p.grade.subject].label[locale]}
                {p.grade.title && <span className="text-muted-foreground"> · {p.grade.title}</span>}
              </td>
              <td className="py-2 pe-3 text-end tabular-nums">{formatOnScale(p.grade.scale, p.grade.value, nf)}</td>
              <td className="py-2 text-end font-medium tabular-nums">{formatScore(p.runningScore, scale, nf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
