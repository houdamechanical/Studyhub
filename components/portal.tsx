"use client";

import { useRouter } from "next/navigation";
import { useEffect, type RefObject } from "react";

/**
 * "Los geht's" → start screen: a circle opens from the button and fills the
 * screen while the app loads underneath. In dark mode it is the start card's
 * colour and folds into the card's rounded frame; in light mode it is the
 * cream page with a blue glow and simply fades away. About 0.6–0.9 s in total.
 * Skipped with reduced motion.
 */
const ID = "sh-portal";
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isDark = () => document.documentElement.classList.contains("dark");

export function usePortalLink(href: string) {
  const router = useRouter();
  return (e: React.MouseEvent<HTMLElement>) => {
    if (reduced() || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const dark = isDark();
    document.getElementById(ID)?.remove();
    const el = document.createElement("div");
    el.id = ID;
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:fixed;inset:0;z-index:100;pointer-events:none;background:${dark ? "#0e0c0a" : "#faf6ee"};`;
    // a soft glow where the button was: warm at night, royal blue by day
    el.style.backgroundImage = `radial-gradient(60% 50% at ${x}px ${y}px, ${dark ? "rgb(255 138 61 / 0.2)" : "rgb(35 80 216 / 0.16)"}, transparent 70%)`;
    document.body.appendChild(el);
    document.documentElement.classList.add("portal-arrive");
    el.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${far}px at ${x}px ${y}px)` }], {
      duration: 360,
      easing: EASE,
      fill: "forwards",
    });
    // Load the next screen while the circle grows.
    router.push(href);
  };
}

/** On the start screen: once the circle is full, fold it into the card (dark) or fade it (light). */
export function usePortalArrival(target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = document.getElementById(ID);
    const done = () => {
      el?.remove();
      document.documentElement.classList.remove("portal-arrive");
    };
    if (!el) return done();
    let cancelled = false;
    const grow = el.getAnimations()[0];
    Promise.resolve(grow?.finished)
      .catch(() => {})
      .then(() => {
        const card = target.current;
        if (cancelled) return;
        if (!card || reduced() || !isDark()) {
          return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-out", fill: "forwards" }).finished.then(done);
        }
        const r = card.getBoundingClientRect();
        const inset = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 28px)`;
        return el
          .animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: inset }], { duration: 420, easing: EASE, fill: "forwards" })
          .finished.then(() => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-out", fill: "forwards" }).finished)
          .then(done);
      });
    // Leaving the start screen mid-way never leaves the overlay behind.
    return () => {
      cancelled = true;
      done();
    };
  }, [target]);
}
