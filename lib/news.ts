"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { SubjectId } from "@/lib/subjects";

/**
 * "What's new" – newest first. Add an entry whenever something ships.
 * `art` picks the picture on the card: a subject (its book colour and icon)
 * or one of the feature pictures.
 */
export type NewsItem = {
  id: string;
  date: string; // YYYY-MM-DD
  art: SubjectId | "profile" | "pad" | "friends" | "home";
  href?: string;
  title: Record<Locale, string>;
  text: Record<Locale, string>;
};

export const NEWS: NewsItem[] = [
  {
    id: "2026-12-nathan-bezug",
    date: "2026-12-05",
    art: "deutsch",
    href: "/library/deutsch/deutsch-lyrik-nathan-bezug",
    title: { de: "Deutsch: Bezug zu Nathan", en: "German: linking to Nathan", ar: "الألمانية: الربط مع ناتان" },
    text: {
      de: "So schreibst du Aufgabe 2: Nathan in 2 Minuten, Aufbau, Formulierungshilfen und eine Musterlösung zu Prometheus vs. Nathan. Dazu bei jeder Epoche: Wo steht sie im Vergleich zu Nathan?",
      en: "How to write task 2: Nathan in two minutes, structure, phrases and a model answer on Prometheus vs. Nathan – plus each era compared with Nathan.",
      ar: "كيف تكتب المهمة الثانية: ناتان في دقيقتين، البنية، عبارات مساعدة وحل نموذجي – ومقارنة كل عصر بناتان.",
    },
  },
  {
    id: "2026-12-lyrik-klausur-2025",
    date: "2026-12-04",
    art: "deutsch",
    href: "/library/deutsch/deutsch-lyrik-klausur-2025",
    title: { de: "Deutsch: Lyrik-Klausur 2025", en: "German: poetry exam 2025", ar: "الألمانية: امتحان الشعر 2025" },
    text: {
      de: "Die echte Probeklausur zu Herweghs „Das Lied vom Hasse“ mit Nathan-Bezug – mit Schreibblatt, Erwartungshorizont und Musterlösung.",
      en: "The real practice exam on Herwegh's “Das Lied vom Hasse” with Nathan – with a writing sheet, marking guide and model answer.",
      ar: "امتحان تجريبي حقيقي عن قصيدة هيرفيغ «أغنية الكراهية» مع ربطها بناتان – مع ورقة كتابة ومعايير تصحيح وحل نموذجي.",
    },
  },
  {
    id: "2026-12-welcome",
    date: "2026-12-03",
    art: "friends",
    href: "/friends",
    title: { de: "Neuer Start für neue Leute", en: "A better start for new people", ar: "بداية أفضل للقادمين الجدد" },
    text: {
      de: "Wer sich neu anmeldet, wählt jetzt erst ein Profilbild, bekommt Freunde vorgeschlagen und wählt dann seine Fächer.",
      en: "New sign-ups now pick a picture, get friend suggestions and then choose their subjects.",
      ar: "من يسجّل جديداً يختار الآن صورة، ثم يرى اقتراحات أصدقاء، ثم يختار مواده.",
    },
  },
  {
    id: "2026-12-kompakt",
    date: "2026-12-02",
    art: "home",
    title: { de: "Kürzer, klarer, Year League", en: "Shorter, clearer, Year League", ar: "أقصر وأوضح، و Year League" },
    text: {
      de: "Lernseiten zeigen erst das Wichtigste – „Ausführlich lesen“ klappt den Rest auf. Neue Quizze, neue Fachseiten und die Rangliste heißt jetzt Year League.",
      en: "Study pages show the key points first – “Ausführlich lesen” opens the rest. New quizzes, new subject pages, and the leaderboard is now the Year League.",
      ar: "صفحات الدراسة تعرض الأهم أولاً – «Ausführlich lesen» يفتح الباقي. كويزات وصفحات مواد جديدة، ولوحة الترتيب اسمها الآن Year League.",
    },
  },
  {
    id: "2026-12-start",
    date: "2026-12-01",
    art: "home",
    title: { de: "Neue Startseite", en: "New home screen", ar: "صفحة رئيسية جديدة" },
    text: {
      de: "Deine nächste Klausur groß im Blick, Neuigkeiten, Freunde und dein NC auf einen Blick. Auf dem iPad mit neuer Leiste oben.",
      en: "Your next exam up front, news, friends and your NC at a glance. On iPad with a new bar at the top.",
      ar: "امتحانك القادم في الواجهة، والأخبار والأصدقاء ومعدلك بنظرة واحدة. على الآيباد مع شريط جديد في الأعلى.",
    },
  },
  {
    id: "2026-12-pad",
    date: "2026-12-01",
    art: "pad",
    href: "/grade/11/1/math",
    title: { de: "Antworten selbst schreiben", en: "Write your own answers", ar: "اكتب إجاباتك بنفسك" },
    text: {
      de: "Unter jeder Aufgabe gibt es jetzt ein Blatt zum Schreiben – mit Stift, Finger oder Apple Pencil. Deine Entwürfe werden gespeichert.",
      en: "Every exercise now has a sheet to write on – with a pen, your finger or Apple Pencil. Drafts are saved.",
      ar: "تحت كل تمرين ورقة للكتابة – بالقلم أو الإصبع أو Apple Pencil. تُحفظ مسوداتك.",
    },
  },
  {
    id: "2026-12-profile",
    date: "2026-12-01",
    art: "profile",
    href: "/profile",
    title: { de: "Profilbilder", en: "Profile pictures", ar: "صور الملف الشخصي" },
    text: {
      de: "Wähle einen animierten Avatar oder lade ein eigenes Foto hoch. Tippe dafür in deinem Profil auf dein Bild.",
      en: "Pick an animated avatar or upload your own photo. Tap your picture on your profile.",
      ar: "اختر صورة متحركة أو ارفع صورتك. اضغط على صورتك في ملفك الشخصي.",
    },
  },
  {
    id: "2026-11-physik",
    date: "2026-11-28",
    art: "physik",
    href: "/grade/11/1/physik",
    title: { de: "Physik: Ladung und Feld", en: "Physics: charge and field", ar: "الفيزياء: الشحنة والمجال" },
    text: {
      de: "Coulomb-Gesetz und elektrisches Feld mit Feldlinien-Simulator, 16 Aufgaben und zwei Quizze.",
      en: "Coulomb's law and the electric field with a field-line simulator, 16 exercises and two quizzes.",
      ar: "قانون كولوم والمجال الكهربائي مع محاكي خطوط المجال و16 تمرينًا واختبارين قصيرين.",
    },
  },
  {
    id: "2026-11-friends",
    date: "2026-11-28",
    art: "friends",
    href: "/friends",
    title: { de: "Freunde und XP", en: "Friends and XP", ar: "الأصدقاء والنقاط" },
    text: {
      de: "Füge Mitschüler hinzu, teile deine Noten nur mit Freunden und sammle XP mit Quizzen.",
      en: "Add classmates, share your grades only with friends, and collect XP with quizzes.",
      ar: "أضف زملاءك وشارك درجاتك مع الأصدقاء فقط واجمع النقاط بالاختبارات القصيرة.",
    },
  },
  {
    id: "2026-11-math",
    date: "2026-11-27",
    art: "math",
    href: "/grade/11/1/math",
    title: { de: "Mathe: Quizze", en: "Maths: quizzes", ar: "الرياضيات: اختبارات قصيرة" },
    text: {
      de: "Multiple-Choice-Quizze zu Extremalproblemen und Funktionsgleichungen – bei jedem Versuch neu gemischt.",
      en: "Multiple-choice tests on optimisation and finding function equations – reshuffled every time.",
      ar: "اختبارات اختيار من متعدد في مسائل القيم القصوى وإيجاد معادلات الدوال.",
    },
  },
  {
    id: "2026-11-deutsch",
    date: "2026-11-27",
    art: "deutsch",
    href: "/grade/11/1/deutsch",
    title: { de: "Deutsch: Lyrik", en: "German: poetry", ar: "الألمانية: الشعر" },
    text: {
      de: "Epochen, Aufbau, Stilmittel, Formulierungshilfen und drei Musterlösungen für die Gedichtinterpretation.",
      en: "Eras, structure, stylistic devices, phrasing help and three model answers for poem analysis.",
      ar: "العصور والبنية والأساليب وعبارات مساعدة وثلاثة حلول نموذجية لتحليل القصائد.",
    },
  },
];

const KEY = "studyhub:news-seen";

/** True while the newest entry hasn't been opened on this device. */
export function useNewsUnseen() {
  const [unseen, setUnseen] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        setUnseen(localStorage.getItem(KEY) !== NEWS[0]?.id);
      } catch {
        setUnseen(false);
      }
    };
    check();
    window.addEventListener("studyhub:news-seen", check);
    return () => window.removeEventListener("studyhub:news-seen", check);
  }, []);
  return unseen;
}

export function markNewsSeen() {
  try {
    localStorage.setItem(KEY, NEWS[0]?.id ?? "");
  } catch {}
  window.dispatchEvent(new Event("studyhub:news-seen"));
}
