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
  label: Record<Locale, string>;
};

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {
  math: {
    emoji: "📐",
    color: "#3b82f6",
    label: { en: "Math", de: "Mathematik", ar: "الرياضيات" },
  },
  deutsch: {
    emoji: "📖",
    color: "#f43f5e",
    label: { en: "German", de: "Deutsch", ar: "اللغة الألمانية" },
  },
  englisch: {
    emoji: "🗣️",
    color: "#8b5cf6",
    label: { en: "English", de: "Englisch", ar: "اللغة الإنجليزية" },
  },
  chemie: {
    emoji: "⚗️",
    color: "#f97316",
    label: { en: "Chemistry", de: "Chemie", ar: "الكيمياء" },
  },
  physik: {
    emoji: "⚡",
    color: "#06b6d4",
    label: { en: "Physics", de: "Physik", ar: "الفيزياء" },
  },
  bio: {
    emoji: "🧬",
    color: "#22c55e",
    label: { en: "Biology", de: "Biologie", ar: "الأحياء" },
  },
  geschichte: {
    emoji: "🏛️",
    color: "#d97706",
    label: { en: "History", de: "Geschichte", ar: "التاريخ" },
  },
  religion: {
    emoji: "🕊️",
    color: "#ec4899",
    label: { en: "Religion", de: "Religion", ar: "الدين" },
  },
};

export function isSubjectId(value: string): value is SubjectId {
  return (SUBJECT_IDS as readonly string[]).includes(value);
}

export function subjectLabel(id: SubjectId, locale: Locale) {
  return SUBJECTS[id].label[locale];
}

