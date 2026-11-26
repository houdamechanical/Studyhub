"use client";

import { CircleUser, LogOut, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

/** Signed in: icon menu with sign-out (no email shown). Signed out: sign-in link. */
export function AccountMenu({ signedIn, isAdmin = false }: { signedIn: boolean; isAdmin?: boolean }) {
  const { dict } = useI18n();
  const router = useRouter();

  if (!signedIn) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">{dict.nav.signIn}</Link>
      </Button>
    );
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={dict.nav.account}>
          <CircleUser size={18} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAdmin && (
          <DropdownMenuItem asChild className="flex gap-2">
            <Link href="/admin">
              <Wrench size={16} className="text-muted-foreground" />
              {dict.nav.admin}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={signOut} className="flex gap-2">
          <LogOut size={16} className="text-muted-foreground" />
          {dict.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
