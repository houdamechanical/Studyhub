"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import type { SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** Cover gradient (light → deep) and text colour of each subject's book. */
export const BOOK_THEME: Record<SubjectId, { from: string; to: string; ink: string }> = {
  math: { from: "#7c89ff", to: "#3341c9", ink: "#ffffff" },
  deutsch: { from: "#ff7b7b", to: "#c92a2a", ink: "#ffffff" },
  englisch: { from: "#4dd4c0", to: "#0f766e", ink: "#ffffff" },
  chemie: { from: "#ffe066", to: "#e67700", ink: "#2b1a00" },
  physik: { from: "#5cb6ff", to: "#1864ab", ink: "#ffffff" },
  bio: { from: "#8ce99a", to: "#2b8a3e", ink: "#0b2512" },
  geschichte: { from: "#e6bb88", to: "#8a5a2b", ink: "#ffffff" },
  religion: { from: "#f78fb3", to: "#a61e4d", ink: "#ffffff" },
  arabisch: { from: "#3bc9db", to: "#0b7285", ink: "#ffffff" },
  kunst: { from: "#ffa94d", to: "#d9480f", ink: "#ffffff" },
  musik: { from: "#b8a2ff", to: "#6741d9", ink: "#ffffff" },
  sport: { from: "#c0eb75", to: "#5c940d", ink: "#172600" },
};

/** One solid colour per subject (for small badges). */
export const BOOK_COLORS = Object.fromEntries(Object.entries(BOOK_THEME).map(([k, v]) => [k, v.to])) as Record<SubjectId, string>;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A subject as a real-looking 3D book: cover, spine, page block. With `href`
 * it follows the pointer (tilt + light glare), and on click the cover swings
 * open before the subject opens.
 */
export function SubjectBook({
  subject,
  label,
  href,
  size = "md",
  className,
}: {
  subject: SubjectId;
  label: string;
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const theme = BOOK_THEME[subject];
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [opening, setOpening] = useState(false);

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; // 0..1
    const y = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty("--ry", `${-22 + x * 30}deg`);
    ref.current.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    ref.current.style.setProperty("--gx", `${x * 100}%`);
    ref.current.style.setProperty("--gy", `${y * 100}%`);
  }
  function onLeave() {
    ref.current?.style.removeProperty("--ry");
    ref.current?.style.removeProperty("--rx");
  }
  function open(e: React.MouseEvent) {
    if (!href || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (reducedMotion()) return router.push(href);
    router.prefetch(href);
    setOpening(true);
    setTimeout(() => router.push(href), 520);
  }

  const book = (
    <div
      ref={ref}
      className={cn("book3d", size === "sm" && "book3d-sm", opening && "is-opening", className)}
      style={{ "--from": theme.from, "--to": theme.to, "--ink": theme.ink } as React.CSSProperties}
      onPointerMove={href ? onMove : undefined}
      onPointerLeave={href ? onLeave : undefined}
    >
      <div className="book3d-body">
        <div className="book3d-pages" />
        <div className="book3d-spine">
          <span>{label}</span>
        </div>
        <div className="book3d-inside">
          <SubjectIcon subject={subject} className="size-6 opacity-70" />
          <span>{label}</span>
        </div>
        <div className="book3d-cover">
          <div className="book3d-pattern" />
          <div className="book3d-icon">
            <SubjectIcon subject={subject} className="size-full" strokeWidth={1.6} />
          </div>
          {size !== "sm" && <p className="book3d-title">{label}</p>}
          <div className="book3d-glare" />
        </div>
      </div>
      <div className="book3d-shadow" />
    </div>
  );

  if (!href) return book;
  return (
    <Link href={href} onClick={open} aria-label={label} className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {book}
    </Link>
  );
}
