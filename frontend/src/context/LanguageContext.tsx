import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getDictionary } from "../i18n";
import type { Language } from "../i18n/translations";

const STORAGE_KEY = "awareness-language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ru";
}

function resolve(dict: unknown, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dict);
  return typeof value === "string" ? value : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  function t(key: string, vars?: Record<string, string | number>): string {
    let value = resolve(getDictionary(language), key) ?? resolve(getDictionary("ru"), key) ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation должен использоваться внутри LanguageProvider");
  return ctx;
}
