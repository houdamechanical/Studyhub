"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";

type Auth = { userId: string; isAdmin: boolean };
const AuthContext = createContext<Auth>({ userId: "", isAdmin: false });

/** Signed-in user (inside <AuthGate>). */
export const useAuth = () => useContext(AuthContext);

/**
 * The site is static, so sign-in is checked in the browser: signed-out visitors
 * are sent to the login page. (The data itself is protected by Row Level
 * Security in the database, not by this redirect.)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(hasEnvVars ? null : { userId: "", isAdmin: false });

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
      // Fails harmlessly (→ false) if the migrations aren't applied yet.
      const { data } = await supabase.rpc("is_admin");
      if (alive) setAuth({ userId, isAdmin: data === true });
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
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
