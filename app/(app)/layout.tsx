import { SearchButton, SkipLink } from "@/components/app-chrome";
import { AuthGate } from "@/components/auth-gate";
import { BackToTop } from "@/components/back-to-top";
import { CommandMenu } from "@/components/command-menu";
import { BottomNav, Logo } from "@/components/main-nav";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <SkipLink />
      <div className="min-h-dvh lg:flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Phones and iPads in portrait: slim top bar + bottom tabs instead of the sidebar */}
          <header className="no-print sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
              <Logo />
              <SearchButton className="-me-2 ms-auto" />
            </div>
          </header>
          <main id="main" tabIndex={-1} className="flex flex-1 flex-col overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none lg:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
      <BackToTop />
      <CommandMenu />
    </AuthGate>
  );
}
