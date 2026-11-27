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
  "arabisch",
  "kunst",
  "musik",
  "sport",
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
  arabisch: {
    emoji: "✍️",
    color: "#14b8a6",
    label: { en: "Arabic", de: "Arabisch", ar: "اللغة العربية" },
  },
  kunst: {
    emoji: "🎨",
    color: "#e11d48",
    label: { en: "Art", de: "Kunst", ar: "الفن" },
  },
  musik: {
    emoji: "🎵",
    color: "#a855f7",
    label: { en: "Music", de: "Musik", ar: "الموسيقى" },
  },
  sport: {
    emoji: "🏃",
    color: "#0ea5e9",
    label: { en: "Sport", de: "Sport", ar: "الرياضة" },
  },
};

/** Everyone picks one of these … */
export const ARTS = ["kunst", "musik"] as const satisfies readonly SubjectId[];
/** … and two of these. */
export const SCIENCES = ["bio", "chemie", "arabisch"] as const satisfies readonly SubjectId[];
const ELECTIVES: readonly SubjectId[] = [...ARTS, ...SCIENCES];

/** A valid choice: exactly one of ARTS and two different SCIENCES. */
export function isValidElectives(list: readonly string[] | null | undefined): list is SubjectId[] {
  if (!list || list.length !== 3 || new Set(list).size !== 3) return false;
  return (
    list.filter((s) => (ARTS as readonly string[]).includes(s)).length === 1 &&
    list.filter((s) => (SCIENCES as readonly string[]).includes(s)).length === 2
  );
}

/** The subjects a student takes: all core subjects plus their electives (everything if not chosen yet). */
export function mySubjects(electives: readonly SubjectId[] | null): SubjectId[] {
  if (!isValidElectives(electives)) return [...SUBJECT_IDS];
  return SUBJECT_IDS.filter((s) => !ELECTIVES.includes(s) || electives.includes(s));
}

export function isSubjectId(value: string): value is SubjectId {
  return (SUBJECT_IDS as readonly string[]).includes(value);
}

export function subjectLabel(id: SubjectId, locale: Locale) {
  return SUBJECTS[id].label[locale];
}

