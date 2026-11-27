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
    if (!href || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (opening) return;
    const el = ref.current;
    if (reducedMotion() || !el) return router.push(href);
    setOpening(true);
    zoomInto(el, theme);
    // Navigate while the book fills the screen; the overlay fades once the new page is there.
    setTimeout(() => router.push(href), 330);
  }

  const book = (
    <div
      ref={ref}
      className={cn("book3d", size === "sm" ? "book3d-sm w-[4.5rem]" : "w-full", opening && "invisible", className)}
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

/**
 * The tapped book grows from where it is to fill the screen (its cover colour
 * and icon), then fades away once the next page has loaded.
 */
function zoomInto(el: HTMLElement, theme: { from: string; to: string; ink: string }) {
  const r = el.getBoundingClientRect();
  const from = window.location.pathname;
  const ov = document.createElement("div");
  ov.className = "book-zoom";
  ov.style.setProperty("--from", theme.from);
  ov.style.setProperty("--to", theme.to);
  ov.style.setProperty("--ink", theme.ink);
  const icon = el.querySelector(".book3d-icon")?.cloneNode(true) as HTMLElement | undefined;
  if (icon) ov.appendChild(icon);
  document.body.appendChild(ov);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ov.animate(
    [
      { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: "6px 14px 14px 6px" },
      { left: "0px", top: "0px", width: `${vw}px`, height: `${vh}px`, borderRadius: "0px" },
    ],
    { duration: 420, easing: "cubic-bezier(0.65, 0, 0.25, 1)", fill: "forwards" },
  );
  icon?.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.6)" }], {
    duration: 420,
    easing: "ease-out",
    fill: "forwards",
  });

  // Fade out when the URL has changed (or after 2.5 s at the latest).
  const started = performance.now();
  const check = () => {
    if (window.location.pathname !== from || performance.now() - started > 2500) {
      setTimeout(() => {
        ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-out", fill: "forwards" }).onfinish = () => ov.remove();
      }, 120);
    } else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
