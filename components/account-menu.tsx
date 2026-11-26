"use client";

import { LogOut, Pencil, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-gate";

/** Signed in: icon menu with sign-out (no email shown). Signed out: sign-in link. */
export function AccountMenu({
  signedIn,
  isAdmin = false,
  nickname = "",
}: {
  signedIn: boolean;
  isAdmin?: boolean;
  nickname?: string;
}) {
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
        <button
          type="button"
          aria-label={dict.nav.account}
          className="press ms-1 flex size-9 items-center justify-center rounded-full border bg-white/[0.06] font-display text-sm font-bold uppercase text-foreground hover:bg-white/10"
        >
          {nickname.slice(0, 1) || "?"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {nickname && (
          <>
            <DropdownMenuLabel className="font-display text-base font-bold">
              <bdi>{nickname}</bdi>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="flex gap-2">
              <Link href="/compare#name">
                <Pencil size={16} className="text-muted-foreground" />
                {dict.compare.nicknameTitle}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
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

/** Account menu for the app header, fed by the signed-in state from <AuthGate>. */
export function HeaderAccount() {
  const { userId, isAdmin, nickname } = useAuth();
  return <AccountMenu signedIn={Boolean(userId)} isAdmin={isAdmin} nickname={nickname} />;
}
