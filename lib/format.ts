import type { Locale } from "@/lib/i18n/config";

/** Intl tag per UI language. Arabic keeps Latin digits so grades and dates read the same everywhere. */
export function intlLocale(locale: Locale) {
  return locale === "ar" ? "ar-u-nu-latn" : locale === "de" ? "de-DE" : "en-GB";
}

/**
 * Format a YYYY-MM-DD date. It is parsed as a local date, so server and browser
 * show the same calendar day whatever their time zone.
 */
export function formatDate(
  date: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" },
) {
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(new Date(`${date}T00:00:00`));
}

/** "08:00:00" → "08:00" */
export function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : "";
}

/** Today's date in the browser's/server's local time as YYYY-MM-DD. */
export function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
