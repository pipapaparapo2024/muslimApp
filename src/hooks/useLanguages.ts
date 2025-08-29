import { useState, useEffect } from "react";
import { useGeoStore } from "../pages/Home/GeoStore";
import i18n from "../api/i18n"; // Импортируйте ваш экземпляр i18n

const LANGUAGE_KEY = "preferred-language";
const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];

const ARABIC_SPEAKING_COUNTRIES = new Set([
  "Algeria", "Bahrain", "Chad", "Comoros", "Djibouti",
  "Egypt", "Iraq", "Jordan", "Kuwait", "Lebanon",
  "Libya", "Mali", "Mauritania", "Morocco", "Oman",
  "Palestine", "Qatar", "Saudi Arabia", "Somalia",
  "Sudan", "Syria", "Tunisia", "United Arab Emirates", "Yemen"
]);

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);
  const { country, isInitialized: isGeoInitialized } = useGeoStore();

  const getDefaultLanguage = (): Language => {
    if (country && ARABIC_SPEAKING_COUNTRIES.has(country.name)) {
      return "ar";
    }
    return "en";
  };

  const applyLanguageStyles = (lang: Language) => {
    const html = document.documentElement;
    html.classList.remove("en", "ar", "ltr", "rtl");
    html.classList.add(lang);
    html.classList.add(lang === "ar" ? "rtl" : "ltr");
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    html.setAttribute("lang", lang);

    document.documentElement.style.setProperty("--start", lang === "ar" ? "right" : "left");
    document.documentElement.style.setProperty("--end", lang === "ar" ? "left" : "right");
    document.documentElement.style.setProperty("--text-align", lang === "ar" ? "right" : "left");
  };

  useEffect(() => {
    const initializeLanguage = () => {
      const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
      const defaultLang = getDefaultLanguage();
      const finalLang = saved && SUPPORTED_LANGUAGES.includes(saved) ? saved : defaultLang;

      setLanguage(finalLang);
      applyLanguageStyles(finalLang);
      i18n.changeLanguage(finalLang); // ← ДОБАВЬТЕ ЭТУ СТРОКУ
      setIsInitialized(true);
    };

    if (isGeoInitialized) {
      initializeLanguage();
    }
  }, [isGeoInitialized]);

  const changeLanguage = (newLang: Language) => {
    if (SUPPORTED_LANGUAGES.includes(newLang)) {
      setLanguage(newLang);
      localStorage.setItem(LANGUAGE_KEY, newLang);
      applyLanguageStyles(newLang);
      i18n.changeLanguage(newLang); // ← ДОБАВЬТЕ ЭТУ СТРОКУ
    }
  };

  return {
    language,
    changeLanguage,
    languageLabel: language === "ar" ? "Arabic" : "English",
    isLanguageReady: isInitialized,
    direction: language === "ar" ? "rtl" : "ltr" as const,
  };
};