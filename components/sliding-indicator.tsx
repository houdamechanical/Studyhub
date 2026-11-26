"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Highlight that slides to the active item of an equal-width row (bottom tab
 * bar, two-way switches). Put it first inside a `relative` container with
 * `count` equal columns. Moves with transform only (cheap) and a strong
 * ease-in-out, since it travels across the screen.
 */
export function SlidingIndicator({
  count,
  index,
  className,
  children,
}: {
  count: number;
  index: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const { locale } = useI18n();
  const dir = locale === "ar" ? -1 : 1;
  // No transition on the very first paint, so it doesn't fly in from the start.
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  if (index < 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 start-0",
        ready && "transition-transform duration-[260ms] ease-in-out",
      )}
      style={{ width: `${100 / count}%`, transform: `translateX(${dir * index * 100}%)` }}
    >
      <span className={cn("absolute", className)}>{children}</span>
    </span>
  );
}

/**
 * Same idea for rows whose items have different widths (header nav): measures
 * the active item (`data-key`) in its parent and moves/resizes the highlight to
 * it. It finds the parent through its own element, because a parent's ref
 * isn't attached yet when a child's layout effect first runs.
 */
export function MeasuredIndicator({ activeKey, className }: { activeKey: string | null; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    const measure = () => {
      const el = activeKey ? container.querySelector<HTMLElement>(`[data-key="${activeKey}"]`) : null;
      setBox(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeKey]);

  // Only animate moves after the first placement.
  useEffect(() => {
    if (!box || animate) return;
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(raf);
  }, [box, animate]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-1 left-0", // offsetLeft is physical, also in RTL
        animate && "transition-[transform,width] duration-[260ms] ease-in-out",
        !box && "opacity-0",
        className,
      )}
      style={box ? { width: box.w, transform: `translateX(${box.x}px)` } : undefined}
    />
  );
}
