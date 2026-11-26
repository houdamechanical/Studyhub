"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { AUTO_NICKNAME, NameOnboarding } from "@/components/name-onboarding";
import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";

type Auth = {
  userId: string;
  isAdmin: boolean;
  /** Public name (profiles.nickname), shown on leaderboards and the home page. */
  nickname: string;
  setNickname: (name: string) => void;
};
const noop = () => {};
const AuthContext = createContext<Auth>({ userId: "", isAdmin: false, nickname: "", setNickname: noop });

/** Signed-in user (inside <AuthGate>). */
export const useAuth = () => useContext(AuthContext);

/**
 * The site is static, so sign-in is checked in the browser: signed-out visitors
 * are sent to the login page. (The data itself is protected by Row Level
 * Security in the database, not by this redirect.)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<Omit<Auth, "setNickname"> | null>(
    hasEnvVars ? null : { userId: "", isAdmin: false, nickname: "" },
  );

  useEffect(() => {
    if (!hasEnvVars) return;
    const supabase = createClient();
    let alive = true;

    async function apply(userId: string | undefined) {
      if (!alive) return;
      if (!userId) {
        setAuth(null);
        router.replace("/auth/login");
        return;
      }
      // Both fail harmlessly if the migrations aren't applied yet.
      const [admin, profile] = await Promise.all([
        supabase.rpc("is_admin"),
        supabase.from("profiles").select("nickname").eq("user_id", userId).maybeSingle(),
      ]);
      const nickname = (profile.data as { nickname: string } | null)?.nickname ?? "";
      if (alive) setAuth({ userId, isAdmin: admin.data === true, nickname });
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") apply(session?.user.id);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!auth) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground" aria-busy>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }
  const setNickname = (nickname: string) => setAuth((a) => (a ? { ...a, nickname } : a));
  // New accounts get a generated name ("Student-k3f9a"): ask for a real one first.
  // (No profiles table yet → empty nickname → skip, the app still works.)
  if (hasEnvVars && AUTO_NICKNAME.test(auth.nickname)) {
    return <NameOnboarding onDone={setNickname} />;
  }
  return <AuthContext.Provider value={{ ...auth, setNickname }}>{children}</AuthContext.Provider>;
}
