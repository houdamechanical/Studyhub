import {
  Atom,
  BookOpenText,
  Church,
  Dna,
  FlaskConical,
  Landmark,
  Languages,
  Music,
  Palette,
  ScrollText,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import type { SubjectId } from "@/lib/subjects";

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
  arabisch: ScrollText,
  kunst: Palette,
  musik: Music,
};

export function SubjectIcon({ subject, className, strokeWidth = 2.25 }: { subject: SubjectId; className?: string; strokeWidth?: number }) {
  const Icon = SUBJECT_ICONS[subject];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

