import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { I18nProvider, LOCALE_BOOT_SCRIPT } from "@/lib/i18n/client";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  // Public address (set by the GitHub Pages build); used for social preview images.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Study Hub", template: "%s · Study Hub" },
  description: "Study pages, exams, grades and practice in one place.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  display: "swap",
  subsets: ["arabic"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang/dir are set in the browser (the site is static); the inline script
    // applies the saved language before the first paint.
    <html lang={DEFAULT_LOCALE} dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${notoArabic.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
