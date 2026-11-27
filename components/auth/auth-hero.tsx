"use client";

import { BookOpen } from "lucide-react";
import { BookRow } from "@/components/auth/book-row";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECT_IDS, SUBJECTS } from "@/lib/subjects";

/**
 * Signed-out start screen: a giant serif wordmark, the subjects as a quiet
 * line under it, and a row of 3D books that rise near the pointer. The auth
 * card (login / sign-up / password) sits in front, bottom-left on large
 * screens and below the books on phones.
 */
export function AuthHero({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return (
    <div className="relative min-h-svh overflow-x-clip lg:h-svh lg:overflow-hidden">
      {/* Hero: wordmark + subjects + books */}
      <section className="relative h-[60svh] lg:absolute lg:inset-0 lg:h-auto">
        <div className="hero-in absolute inset-x-0 top-0 z-[5] flex items-center gap-2.5 px-5 pt-5 [--d:0ms] sm:px-8 lg:px-[6vw] lg:pt-[4.6vh]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen size={17} strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg">Study Hub</span>
        </div>

        <h1
          className="wordmark-in absolute inset-x-0 top-[13svh] z-[1] text-center font-display font-light leading-none text-foreground lg:top-[9vh]"
          style={{ fontSize: "min(15vw, 19vh)", letterSpacing: "-0.035em" }}
        >
          Study Hub
        </h1>
        <p className="hero-in absolute inset-x-0 top-[calc(13svh+min(15vw,19vh)+2.2vh)] z-[1] mx-auto flex max-w-3xl flex-wrap justify-center gap-x-5 gap-y-1 px-6 text-[13px] text-muted-foreground [--d:850ms] lg:top-[calc(9vh+min(15vw,19vh)+2.6vh)]">
          {SUBJECT_IDS.map((id) => (
            <span key={id}>{SUBJECTS[id].label[locale]}</span>
          ))}
        </p>

        <BookRow className="absolute inset-x-0 bottom-0 top-[30%] z-[2] lg:top-0" />
        {/* soft fade so the books sink into the floor on phones */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16 bg-gradient-to-t from-background to-transparent lg:hidden" />
      </section>

      {/* Auth card */}
      <div className="hero-in relative z-[5] px-4 pb-10 [--d:600ms] lg:absolute lg:bottom-[7vh] lg:left-[6vw] lg:w-[24rem] lg:p-0 [&>div]:min-h-0 [&>div]:p-0 [&_.text-card-foreground]:border-border/70 [&_.text-card-foreground]:bg-card/90 [&_.text-card-foreground]:shadow-[0_18px_48px_-20px_rgb(0_0_0/0.7)] [&_.text-card-foreground]:backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
