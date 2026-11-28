import { SearchButton, SkipLink } from "@/components/app-chrome";
import { AuthGate } from "@/components/auth-gate";
import { BackToTop } from "@/components/back-to-top";
import { CommandMenu } from "@/components/command-menu";
import { BottomNav, Logo, PhoneNewsButton, TopNav } from "@/components/main-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <SkipLink />
      <div className="flex min-h-dvh flex-col">
        {/* iPad and computer: floating bar at the top */}
        <TopNav />
        {/* Phones: slim top bar + bottom tabs */}
        <header className="no-print sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4">
            <Logo />
            <PhoneNewsButton className="ms-auto" />
            <SearchButton className="-me-2" />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
      <BackToTop />
      <CommandMenu />
    </AuthGate>
  );
}
