import { useState, useEffect } from "react";
import i18n from "../api/i18n"; 
import { quranApi } from "../api/api";

const LANGUAGE_KEY = "preferred-language";
const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(i18n.language as Language);
  const [isInitialized, setIsInitialized] = useState(i18n.isInitialized);
  const [isChanging, setIsChanging] = useState(false);

  const applyLanguageStyles = (lang: Language) => {
    const html = document.documentElement;
    html.classList.remove("en", "ar");
    html.classList.add(lang);
    html.setAttribute("lang", lang);
  };

  // УБРАТЬ fetchLanguageFromBackend - он больше не нужен здесь
  const setLanguageOnBackend = async (lang: Language): Promise<void> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await quranApi.post(
        "api/v1/settings/languages",
        { language: lang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error setting language:", error);
    }
  };

  const changeLanguageComplete = async (newLang: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang) || isChanging) return;

    setIsChanging(true);
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
    const initializeLanguage = async () => {
      try {
        // УПРОЩЕННАЯ ИНИЦИАЛИЗАЦИЯ - только из localStorage
        const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
        const targetLanguage =
          saved && SUPPORTED_LANGUAGES.includes(saved) ? saved : "en";

        if (targetLanguage !== i18n.language) {
          applyLanguageStyles(targetLanguage);
          await i18n.changeLanguage(targetLanguage);
          setLanguage(targetLanguage);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Language initialization error:", error);
        setIsInitialized(true);
      }
    };

    if (i18n.isInitialized) {
      initializeLanguage();
    } else {
      i18n.on("initialized", initializeLanguage);
    }

    return () => {
      i18n.off("initialized", initializeLanguage);
    };
  }, []);

  return {
    language,
    changeLanguage: changeLanguageComplete,
    languageLabel: language === "ar" ? i18n.t("arabic") : i18n.t("english"),
    isLanguageReady: isInitialized,
    isChanging,
    // УБРАТЬ getLanguage - он больше не нужен
  };
};
