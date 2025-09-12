import { useState, useEffect } from "react";
import i18n from "../api/i18n";
import { quranApi } from "../api/api";
export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageData {
  code: Language;
  name: string;
  url: string;
}

export const LANGUAGE_MAP: Record<Language, string> = {
  en: "English",
  ar: "Arabic",
};

export const applyLanguageStyles = (lang: Language): void => {
  const html = document.documentElement;
  html.classList.remove("en", "ar");
  html.classList.add(lang);
  html.setAttribute("lang", lang);
  html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
};
const LANGUAGE_KEY = "preferred-language";

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(i18n.language as Language);
  const [isChanging, setIsChanging] = useState(false);

  const setLanguageOnBackend = async (lang: Language): Promise<void> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      await quranApi.post(
        "api/v1/settings/languages",
        { languageId: lang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error setting language:", error);
    }
  };

  const changeLanguage = async (newLang: Language) => {
    setIsChanging(true);
    console.log("newLang",newLang)
    try {
      applyLanguageStyles(newLang);
      localStorage.setItem(LANGUAGE_KEY, newLang);
      await setLanguageOnBackend(newLang);
      await i18n.changeLanguage(newLang);
      setLanguage(newLang);
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setIsChanging(false);
    }
  };

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (SUPPORTED_LANGUAGES.includes(lng as Language)) {
        const lang = lng as Language;
        setLanguage(lang);
        applyLanguageStyles(lang);
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => { i18n.off('languageChanged', handleLanguageChanged); };
  }, []);

  return {
    language,
    changeLanguage,
    languageLabel: language === "ar" ? i18n.t("arabic") : i18n.t("english"),
    isChanging,
  };
};