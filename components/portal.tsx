"use client";

import { useRouter } from "next/navigation";
import { useEffect, type RefObject } from "react";

/**
 * "Los geht's" → start screen: a dark circle opens from the button and fills
 * the screen, the app opens underneath, and the darkness folds into the start
 * card's rounded frame before fading out. Same colour as the card, so the card
 * seems to grow out of the button. Skipped with reduced motion.
 */
const ID = "sh-portal";
const INK = "#0e0c0a";
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function usePortalLink(href: string) {
  const router = useRouter();
  return (e: React.MouseEvent<HTMLElement>) => {
    if (reduced() || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.getElementById(ID)?.remove();
    const el = document.createElement("div");
    el.id = ID;
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:fixed;inset:0;z-index:100;pointer-events:none;background:${INK};`;
    // a soft warm glow in the middle of the circle, like the card's light
    el.style.backgroundImage = `radial-gradient(60% 50% at ${x}px ${y}px, rgb(255 138 61 / 0.18), transparent 70%)`;
    document.body.appendChild(el);
    document.documentElement.classList.add("portal-arrive");
    router.prefetch(href);
    el.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${far}px at ${x}px ${y}px)` }], {
      duration: 620,
      easing: EASE,
      fill: "forwards",
    }).finished.then(() => router.push(href));
  };
}

/** On the start screen: fold the portal into the card (`target`), then fade it away. */
export function usePortalArrival(target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = document.getElementById(ID);
    if (!el) {
      document.documentElement.classList.remove("portal-arrive");
      return;
    }
    const card = target.current;
    if (!card || reduced()) {
      el.remove();
      document.documentElement.classList.remove("portal-arrive");
      return;
    }
    // Let the card lay out first.
    const id = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const inset = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 28px)`;
      const fold = el.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: inset }], {
        duration: 700,
        easing: EASE,
        fill: "forwards",
      });
      fold.finished
        .then(() => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: "ease-out", fill: "forwards" }).finished)
        .then(() => {
          el.remove();
          document.documentElement.classList.remove("portal-arrive");
        });
    });
    return () => cancelAnimationFrame(id);
  }, [target]);
}
