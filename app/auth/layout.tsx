import { BookOpen } from "lucide-react";

/** Login, sign-up and password pages: logo above a single card. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-8">
      <div className="enter flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen size={19} strokeWidth={2.25} />
        </span>
        <span className="font-display text-2xl font-bold">Study Hub</span>
      </div>
      <div className="enter w-full [animation-delay:60ms] [&>div]:min-h-0 [&>div]:p-0 [&>div]:py-6">{children}</div>
    </div>
  );
}
