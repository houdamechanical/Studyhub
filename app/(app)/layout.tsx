import { AuthGate } from "@/components/auth-gate";
import { HeaderAccount } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNav, DesktopNav, Logo } from "@/components/main-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="relative isolate min-h-dvh flex flex-col">
        {/* Soft colour glow behind the top of every page */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-70 dark:opacity-40"
          style={{
            background:
              "radial-gradient(40% 60% at 10% 0%, rgb(99 102 241 / 0.18), transparent 70%), radial-gradient(35% 55% at 90% 5%, rgb(236 72 153 / 0.16), transparent 70%), radial-gradient(30% 40% at 50% 0%, rgb(168 85 247 / 0.14), transparent 70%)",
          }}
        />
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
            <Logo />
            <div className="flex flex-1 justify-center">
              <DesktopNav />
            </div>
            <div className="flex items-center gap-0.5">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <HeaderAccount />
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </AuthGate>
  );
}
