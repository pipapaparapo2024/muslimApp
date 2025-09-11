import { useState, useEffect } from "react";
import { useGeoStore } from "./useGeoStore";
import i18n from "../api/i18n";
import { t } from "i18next";

const LANGUAGE_KEY = "preferred-language";
const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);
  const { isInitialized: isGeoInitialized } = useGeoStore();
  const [isChanging, setIsChanging] = useState(false); // 🔥 Новое состояние

  const applyLanguageStyles = (lang: Language) => {
    const html = document.documentElement;

    // Удаляем все предыдущие классы языков
    html.classList.remove("en", "ar");

    // Добавляем только языковой класс
    html.classList.add(lang);

    // Устанавливаем языковой атрибут
    html.setAttribute("lang", lang);

  };
  const changeLanguageComplete = async (newLang: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang) || isChanging) return;

    setIsChanging(true);
    try {
      // 1. Сначала применяем стили СИНХРОННО
      applyLanguageStyles(newLang);

      // 2. Затем обновляем состояние и localStorage
      setLanguage(newLang);
      localStorage.setItem(LANGUAGE_KEY, newLang);

      // 3. Асинхронно меняем язык в i18n (не блокирует UI)
      i18n
        .changeLanguage(newLang)
        .then(() => console.log("i18n language changed to:", newLang))
        .catch((err) => {
          console.error("Language change error:", err);
        });
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setIsChanging(false);
    }
  };
  useEffect(() => {
    const initializeLanguage = async () => {
      const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
      const defaultLang = getDefaultLanguage();
      const finalLang =
        saved && SUPPORTED_LANGUAGES.includes(saved) ? saved : defaultLang;

      try {
        // Используем ту же функцию для инициализации
        await changeLanguageComplete(finalLang);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing language:", error);
        setIsInitialized(true);
      }
    };



    if (isGeoInitialized) {
      initializeLanguage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeoInitialized]);

  return {
    language,
    changeLanguage: changeLanguageComplete,
    languageLabel: language === "ar" ? t("arabic") : t("english"),
    isLanguageReady: isInitialized,
    isChanging, // 🔥 Возвращаем состояние изменения
  };
};
