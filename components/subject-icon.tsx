import {
  Atom,
  BookOpenText,
  Church,
  Dna,
  FlaskConical,
  Landmark,
  Languages,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import type { SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** One icon per subject – the same on every device, unlike emoji. */
export const SUBJECT_ICONS: Record<SubjectId, LucideIcon> = {
  math: Sigma,
  deutsch: BookOpenText,
  englisch: Languages,
  chemie: FlaskConical,
  physik: Atom,
  bio: Dna,
  geschichte: Landmark,
  religion: Church,
};

export function SubjectIcon({ subject, className, strokeWidth = 2.25 }: { subject: SubjectId; className?: string; strokeWidth?: number }) {
  const Icon = SUBJECT_ICONS[subject];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/**
 * Icon on a frosted glass chip with a top highlight and soft shadow, for use on
 * gradients. `size` is the chip's Tailwind size class.
 */
export function GlassIcon({ icon: Icon, className, iconClassName }: { icon: LucideIcon; className?: string; iconClassName?: string }) {
  return (
    <span className={cn("glass flex shrink-0 items-center justify-center rounded-2xl text-white", className)}>
      <Icon className={cn("size-[45%] drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]", iconClassName)} strokeWidth={2.25} aria-hidden />
    </span>
  );
}

/** Subject icon on a small gradient square (for use on white cards). */
export function SubjectBadge({ subject, gradient, className }: { subject: SubjectId; gradient: string; className?: string }) {
  return (
    <span
      className={cn("relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-sm", className)}
      style={{ backgroundImage: gradient }}
    >
      <SubjectIcon subject={subject} className="size-[55%]" />
    </span>
  );
}
