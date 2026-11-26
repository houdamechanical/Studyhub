import Link from "next/link";
import { AuthGate } from "@/components/auth-gate";
import { HeaderAccount } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNav, DesktopNav } from "@/components/main-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
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
              <HeaderAccount />
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </AuthGate>
  );
}
