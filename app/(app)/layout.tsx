import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNav, DesktopNav } from "@/components/main-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let signedIn = false;
  let isAdmin = false;
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
    if (signedIn) {
      // Fails harmlessly (→ false) until the Phase 3 migration is applied.
      const { data: admin } = await supabase.rpc("is_admin");
      isAdmin = admin === true;
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/library" className="font-semibold tracking-tight">
            Study Hub
          </Link>
          <DesktopNav />
          <div className="ms-auto flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <AccountMenu signedIn={signedIn} isAdmin={isAdmin} />
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
