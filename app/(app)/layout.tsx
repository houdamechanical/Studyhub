import { AuthGate } from "@/components/auth-gate";
import { HeaderAccount } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNav, DesktopNav, Logo } from "@/components/main-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-dvh flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
            <Logo />
            <div className="flex flex-1 justify-center">
              <DesktopNav />
            </div>
            <div className="flex items-center gap-0.5">
              <LanguageSwitcher />
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
