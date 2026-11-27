"use client";

import { Laptop, LogOut, Moon, Sun, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { ProfileCard } from "@/components/compare/profile-card";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { isLocale, LOCALE_NAMES, LOCALES } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { dict, locale, setLocale } = useI18n();
  const t = dict.settings;
  useTitle(t.title);
  const { nickname, isAdmin } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
  }

  const themes: { value: string; label: string; icon: LucideIcon }[] = [
    { value: "light", label: dict.nav.light, icon: Sun },
    { value: "dark", label: dict.nav.dark, icon: Moon },
    { value: "system", label: dict.nav.system, icon: Laptop },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero back={{ href: "/home", label: dict.school.backHome }} title={t.title} subtitle={t.subtitle} />

      <div className="mt-8 flex flex-col">
        <Section title={t.profile}>
          <ProfileCard nickname={nickname} shared={[]} part="name" />
        </Section>

        <Section title={t.appearance}>
          <Segmented
            label={t.appearance}
            value={mounted ? (theme ?? "dark") : ""}
            onChange={setTheme}
            options={themes.map(({ value, label, icon: Icon }) => ({
              value,
              label: (
                <>
                  <Icon size={16} aria-hidden />
                  {label}
                </>
              ),
            }))}
          />
        </Section>

        <Section title={t.language}>
          <Segmented
            label={t.language}
            value={locale}
            onChange={(v) => isLocale(v) && setLocale(v)}
            options={LOCALES.map((l) => ({ value: l, label: <span lang={l}>{LOCALE_NAMES[l]}</span> }))}
          />
        </Section>

        <Section title={t.account}>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild variant="outline">
                <Link href="/admin">
                  <Wrench />
                  {t.admin}
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut />
              {dict.nav.signOut}
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hairline enter py-6 first:border-t-0 first:pt-0">
      <h2 className="eyebrow mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: React.ReactNode }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border bg-card p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "press flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
              on ? "bg-[var(--c-pill)] text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
