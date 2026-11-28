"use client";

import { useAdmins } from "@/lib/people";
import { cn } from "@/lib/utils";

/** A student's name, with "(Admin)" after it for admin accounts. */
export function NameTag({ userId, name, className }: { userId?: string; name: string; className?: string }) {
  const admins = useAdmins();
  return (
    <span className={cn("min-w-0", className)}>
      <bdi>{name}</bdi>
      {userId && admins.has(userId) && <span className="ms-1 whitespace-nowrap text-[0.85em] font-semibold text-[var(--c-amber)]">(Admin)</span>}
    </span>
  );
}
