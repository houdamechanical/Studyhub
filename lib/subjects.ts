import type { Locale } from "@/lib/i18n/config";

export const SUBJECT_IDS = [
  "math",
  "deutsch",
  "englisch",
  "chemie",
  "physik",
  "bio",
  "geschichte",
  "religion",
] as const;

export type SubjectId = (typeof SUBJECT_IDS)[number];

type SubjectInfo = {
  emoji: string;
  /** Accent color, used as a CSS variable so it works in light and dark mode. */
  color: string;
  /** Two colours for the subject's gradient tiles (white text sits on them). */
  gradient: [string, string];
  label: Record<Locale, string>;
};

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {
  math: {
    emoji: "📐",
    color: "#3b82f6",
    gradient: ["#3b82f6", "#6366f1"],
    label: { en: "Math", de: "Mathematik", ar: "الرياضيات" },
  },
  deutsch: {
    emoji: "📖",
    color: "#f43f5e",
    gradient: ["#f43f5e", "#f97316"],
    label: { en: "German", de: "Deutsch", ar: "اللغة الألمانية" },
  },
  englisch: {
    emoji: "🗣️",
    color: "#8b5cf6",
    gradient: ["#8b5cf6", "#d946ef"],
    label: { en: "English", de: "Englisch", ar: "اللغة الإنجليزية" },
  },
  chemie: {
    emoji: "⚗️",
    color: "#f97316",
    gradient: ["#f97316", "#e11d48"],
    label: { en: "Chemistry", de: "Chemie", ar: "الكيمياء" },
  },
  physik: {
    emoji: "⚡",
    color: "#06b6d4",
    gradient: ["#06b6d4", "#3b82f6"],
    label: { en: "Physics", de: "Physik", ar: "الفيزياء" },
  },
  bio: {
    emoji: "🧬",
    color: "#22c55e",
    gradient: ["#22c55e", "#0d9488"],
    label: { en: "Biology", de: "Biologie", ar: "الأحياء" },
  },
  geschichte: {
    emoji: "🏛️",
    color: "#d97706",
    gradient: ["#d97706", "#92400e"],
    label: { en: "History", de: "Geschichte", ar: "التاريخ" },
  },
  religion: {
    emoji: "🕊️",
    color: "#ec4899",
    gradient: ["#ec4899", "#a855f7"],
    label: { en: "Religion", de: "Religion", ar: "الدين" },
  },
};

export function isSubjectId(value: string): value is SubjectId {
  return (SUBJECT_IDS as readonly string[]).includes(value);
}

export function subjectLabel(id: SubjectId, locale: Locale) {
  return SUBJECTS[id].label[locale];
}

/**
 * CSS background for a subject's gradient tile: a soft mesh (a light highlight
 * top-left, the deep colour bottom-right) over a linear base, so it has depth
 * instead of a flat two-colour fade.
 */
export function subjectGradient(id: SubjectId, angle = 135) {
  return meshGradient(...SUBJECTS[id].gradient, angle);
}

export function meshGradient(a: string, b: string, angle = 135) {
  return [
    `radial-gradient(at 0% 0%, color-mix(in oklab, ${a} 70%, white) 0, transparent 55%)`,
    `radial-gradient(at 100% 100%, color-mix(in oklab, ${b} 80%, black) 0, transparent 60%)`,
    `radial-gradient(at 85% 10%, color-mix(in oklab, ${b} 75%, white) 0, transparent 45%)`,
    `linear-gradient(${angle}deg, ${a}, ${b})`,
  ].join(", ");
}
