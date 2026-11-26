"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Client-side redirect for old addresses (the site is static, so no server redirects). */
export function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => router.replace(to), [router, to]);
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground" aria-busy>
      <Loader2 className="animate-spin" size={24} />
    </div>
  );
}
