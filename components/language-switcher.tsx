"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_NAMES, LOCALES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

export function LanguageSwitcher() {
  const { locale, dict, setLocale } = useI18n();

  function change(value: string) {
    if (isLocale(value) && value !== locale) setLocale(value);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={dict.nav.language}>
          <Languages size={16} className="text-muted-foreground" />
          <span className="text-xs font-medium uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l} lang={l}>
              {LOCALE_NAMES[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
