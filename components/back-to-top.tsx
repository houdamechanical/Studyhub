"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Appears after scrolling down a long page; floats above the phone tab bar. */
export function BackToTop() {
  const { dict } = useI18n();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label={dict.search.toTop}
      title={dict.search.toTop}
      tabIndex={shown ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={cn(
        "no-print fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] end-4 z-30 flex size-10 items-center justify-center rounded-full border bg-popover text-muted-foreground shadow-lg transition-[opacity,transform] duration-200 hover:text-foreground lg:bottom-6",
        shown ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp size={17} />
    </button>
  );
}
