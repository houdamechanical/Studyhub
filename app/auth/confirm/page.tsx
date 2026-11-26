"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Link target of Supabase confirmation / password-reset emails:
// /auth/confirm?token_hash=…&type=…&next=/library
export default function ConfirmPage() {
  return (
    <Suspense>
      <Confirm />
    </Suspense>
  );
}

function Confirm() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const next = params.get("next");
    // Only allow in-app paths as the target.
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/library";
    if (!token_hash || !type) {
      router.replace("/auth/error?error=No token hash or type");
      return;
    }
    createClient()
      .auth.verifyOtp({ type, token_hash })
      .then(({ error }) =>
        router.replace(error ? `/auth/error?error=${encodeURIComponent(error.message)}` : target),
      );
  }, [params, router]);

  return (
    <div className="flex min-h-svh items-center justify-center text-muted-foreground" aria-busy>
      <Loader2 className="animate-spin" size={24} />
    </div>
  );
}
