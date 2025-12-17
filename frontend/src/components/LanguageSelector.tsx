// LanguageSelector.tsx
import { useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import { useSecureLocalStorage } from "@/hooks/useSecureLocalStorage";

// ----- Typage strict -----
const languages = [
  { code: "fr", name: "Français",  flag: "🇫🇷" },
  { code: "en", name: "English",   flag: "🇬🇧" },
  { code: "es", name: "Español",   flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ee", name: "Eʋegbe",    flag: "🇹🇬" }, // Ewé (Togo)
] as const;

type LanguageCode = typeof languages[number]["code"];

// ----- Composant -----
export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const { sanitizeAndValidate } = useSecurityMonitor();
  const { value: storedLang, setValue: setStoredLang } = useSecureLocalStorage('lang', 'fr');

  // Evite l'accès à window/localStorage côté SSR
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // Mémo perf
  const supportedCodes = useMemo<readonly LanguageCode[]>(
    () => languages.map(l => l.code),
    []
  );

  const currentLang = useMemo(
    () => languages.find(l => l.code === (language as LanguageCode)) ?? languages[0],
    [language]
  );

  // Détection langue navigateur
  const getBrowserLanguage = (): LanguageCode => {
    try {
      const nav = navigator?.language?.split("-")[0]?.toLowerCase();
      return (supportedCodes.includes(nav as LanguageCode) ? (nav as LanguageCode) : "fr");
    } catch {
      return "fr";
    }
  };

  // Chargement initial sécurisé
  useEffect(() => {
    if (!isClient) return;
    
    const validStoredLang = supportedCodes.includes(storedLang as LanguageCode) ? (storedLang as LanguageCode) : null;
    const picked = validStoredLang || getBrowserLanguage();
    
    if (supportedCodes.includes(picked as LanguageCode)) {
      setLanguage(picked as LanguageCode);
    }
  }, [isClient, setLanguage, supportedCodes, storedLang]);

  // Changement sécurisé + persistance
  const handleChangeLanguage = (code: string) => {
    // Validation sécurisée
    const sanitized = sanitizeAndValidate(code, 'language');
    
    if (!sanitized || !supportedCodes.includes(sanitized as LanguageCode)) {
      console.warn("Langue non supportée ignorée :", code);
      return;
    }
    
    const validCode = sanitized as LanguageCode;
    setLanguage(validCode);
    setStoredLang(validCode);
  };

  if (!isClient) {
    return (
      <Button variant="ghost" size="sm" aria-label="Chargement de la langue">
        <Languages className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline ml-2">Loading…</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Changer de langue"
          className="flex items-center gap-2"
        >
          <Languages className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">
            {currentLang.flag} {currentLang.name}
          </span>
          <span className="sm:hidden" title={currentLang.name}>
            {currentLang.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLanguage(lang.code)}
            className={`flex items-center gap-2 ${
              language === lang.code ? "font-semibold bg-gray-100" : ""
            }`}
            aria-current={language === lang.code ? "true" : undefined}
            title={lang.name}
          >
            <span role="img" aria-label={lang.name}>{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}