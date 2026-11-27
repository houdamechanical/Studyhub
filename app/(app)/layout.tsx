import { AuthGate } from "@/components/auth-gate";
import { HeaderAccount } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNav, Logo } from "@/components/main-nav";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-dvh lg:flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Phones and iPads in portrait: slim top bar + bottom tabs instead of the sidebar */}
          <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
              <Logo />
              <div className="ms-auto flex items-center gap-0.5">
                <LanguageSwitcher />
                <HeaderAccount />
              </div>
            </div>
          </header>
          <main className="flex flex-1 flex-col overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
        </div>
        <BottomNav />
      </div>
    </AuthGate>
  );
}
