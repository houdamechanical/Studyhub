import { BookOpen } from "lucide-react";
import { Blobs } from "@/components/name-onboarding";

/** Login, sign-up and password pages: the colourful gradient with a floating card. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative isolate min-h-svh overflow-hidden bg-brand">
      <Blobs />
      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 py-8">
        <div className="enter flex items-center gap-3 text-white">
          <span className="glass flex size-12 items-center justify-center rounded-2xl shadow-lg">
            <BookOpen size={24} strokeWidth={2.5} />
          </span>
          <span className="font-display text-3xl font-extrabold tracking-tight drop-shadow-sm">Study Hub</span>
        </div>
        <div className="w-full [&>div]:min-h-0 [&>div]:p-0 [&>div]:py-6 [&_.rounded-3xl]:rounded-4xl [&_.rounded-3xl]:border-white/40 [&_.rounded-3xl]:shadow-2xl enter [animation-delay:80ms]">
          {children}
        </div>
      </div>
    </div>
  );
}
