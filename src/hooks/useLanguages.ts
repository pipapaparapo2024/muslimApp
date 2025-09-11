import { useState, useEffect, useCallback } from "react";
import i18n from "../api/i18n"; // Ваш файл с инициализацией i18n
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

  const fetchLanguageFromBackend = async (): Promise<Language> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return "en";

      const response = await quranApi.get("/api/v1/languages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const backendLanguage = response.data.language;
      return SUPPORTED_LANGUAGES.includes(backendLanguage)
        ? backendLanguage
        : "en";
    } catch (error) {
      console.error("Error fetching language:", error);
      return "en";
    }
  };
  const getLanguage = useCallback(fetchLanguageFromBackend, []);
  const setLanguageOnBackend = async (lang: Language): Promise<void> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await quranApi.post(
        "/api/v1/languages",
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
      // 1. Применяем стили
      applyLanguageStyles(newLang);

      // 2. Обновляем localStorage
      localStorage.setItem(LANGUAGE_KEY, newLang);

      // 3. Устанавливаем на бекенде
      await setLanguageOnBackend(newLang);

      // 4. Меняем язык в i18n
      await i18n.changeLanguage(newLang);

      // 5. Обновляем состояние
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
        const token = localStorage.getItem("accessToken");
        let targetLanguage: Language = "en";

        if (token) {
          // Пробуем получить язык с бекенда
          targetLanguage = await fetchLanguageFromBackend();
        } else {
          // Fallback на сохраненный язык
          const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
          if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
            targetLanguage = saved;
          }
        }

        // Применяем язык, если он отличается от текущего
        if (targetLanguage !== i18n.language) {
          await changeLanguageComplete(targetLanguage);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Language initialization error:", error);
        setIsInitialized(true);
      }
    };

    // Ждем инициализации i18n перед запуском
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
    getLanguage,
  };
};
