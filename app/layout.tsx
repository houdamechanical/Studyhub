import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Noto_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/toast";
import { I18nProvider, LOCALE_BOOT_SCRIPT } from "@/lib/i18n/client";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  // Public address (set by the GitHub Pages build); used for social preview images.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Study Hub", template: "%s · Study Hub" },
  description: "Study pages, exams, grades and practice in one place.",
  applicationName: "Study Hub",
  // "Add to Home Screen" on iPhone/iPad: open full-screen, without Safari's bars.
  // The icon comes from app/apple-icon.png, the rest from app/manifest.ts.
  appleWebApp: { capable: true, title: "Study Hub", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // Next only emits the newer "mobile-web-app-capable"; iOS before 17.4 still
  // needs the Apple-prefixed tag to open the home-screen app full-screen.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  // Lets content use the whole screen; the bottom tab bar adds the safe-area
  // padding itself so it stays clear of the home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "dark light",
};

// Body and UI: clean, very readable sans.
const inter = Inter({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Headings: expressive grotesque with optical sizes.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
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
      <body className={`${inter.variable} ${display.variable} ${notoArabic.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
