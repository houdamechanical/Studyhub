"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthHero } from "@/components/auth/auth-hero";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";

type Session = { status: "loading" } | { status: "out" } | { status: "in"; nickname: string };

/**
 * Start screen, every time the app opens: the 3D book row, then either the
 * login card (signed out) or a "Hop in" card (signed in).
 */
export default function StartPage() {
  const [session, setSession] = useState<Session>(hasEnvVars ? { status: "loading" } : { status: "out" });

  useEffect(() => {
    if (!hasEnvVars) return;
    const supabase = createClient();
    let alive = true;
    async function apply(userId: string | undefined) {
      if (!userId) {
        if (alive) setSession({ status: "out" });
        return;
      }
      const { data } = await supabase.from("profiles").select("nickname").eq("user_id", userId).maybeSingle();
      if (alive) setSession({ status: "in", nickname: (data as { nickname: string } | null)?.nickname ?? "" });
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") apply(undefined);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthHero>
      {session.status === "loading" ? (
        // Keeps the card's place so nothing jumps when the session arrives.
        <div className="h-48" aria-busy />
      ) : session.status === "out" ? (
        <LoginForm />
      ) : (
        <HopIn nickname={session.nickname} />
      )}
    </AuthHero>
  );
}

function HopIn({ nickname }: { nickname: string }) {
  const { dict } = useI18n();
  const t = dict.home;

  async function signOut() {
    await createClient().auth.signOut();
  }

  return (
    <Card className="enter">
      <CardContent className="flex flex-col gap-5 p-6">
        <div>
          <p className="eyebrow">{t.welcome}</p>
          <p className="mt-2 break-words font-display text-3xl font-semibold leading-tight">
            <bdi>{nickname || "…"}</bdi>
          </p>
        </div>
        <Button asChild size="lg" className="h-12 w-full rounded-xl text-base">
          <Link href="/home">
            {t.hopIn}
            <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t.notYou}{" "}
          <button type="button" onClick={signOut} className="hit font-medium text-foreground underline underline-offset-4">
            {dict.nav.signOut}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
