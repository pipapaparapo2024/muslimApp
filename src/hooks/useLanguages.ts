import { useState, useEffect } from "react";
import { quranApi } from "../api/api";
import { useGeoStore } from "./useGeoStore";
import { useTranslationsStore } from "./useTranslations";
import { usePrayerApiStore } from "./usePrayerApiStore";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_KEY = "preferred-language";

const arabId = "7b64a96d-1dc9-4cd0-b3f0-59cbfbc9fdf7";
const enId = "1e5a0c2e-8e6b-4e76-8fc0-2b0f5a933b4a";

export const applyLanguageStyles = (lang: Language): void => {
  const html = document.documentElement;
  html.classList.remove("en", "ar");
  html.classList.add(lang);
  html.setAttribute("lang", lang);
  html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
};

export const useLanguage = () => {
  const { coords } = useGeoStore();
  const { fetchPrayers } = usePrayerApiStore();
  const { translations, loadTranslations } = useTranslationsStore();

  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem(LANGUAGE_KEY) as Language) || "en"
  );
  const [isChanging, setIsChanging] = useState(false);

  // 🔹 Загружаем язык с бэкенда при старте (основной источник)
  useEffect(() => {
    const fetchLanguageFromBackend = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await quranApi.get("api/v1/settings/languages/selected", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const backendLanguage = response.data.data.language.languageCode as Language;

        if (backendLanguage && SUPPORTED_LANGUAGES.includes(backendLanguage)) {
          setLanguage(backendLanguage);
          applyLanguageStyles(backendLanguage);
          localStorage.setItem(LANGUAGE_KEY, backendLanguage);
          await loadTranslations(backendLanguage);
        }
      } catch (error) {
        console.error("Error fetching language:", error);
      }
    };

    fetchLanguageFromBackend();
  }, [loadTranslations]);

  // 🔹 Меняем язык вручную (по действию пользователя)
  const changeLanguage = async (newLang: Language) => {
    if (newLang === language) return;

    setIsChanging(true);
    try {
      applyLanguageStyles(newLang);
      localStorage.setItem(LANGUAGE_KEY, newLang);

      const token = localStorage.getItem("accessToken");
      if (token) {
        const langId = newLang === "ar" ? arabId : enId;
        await quranApi.post(
          "api/v1/settings/languages",
          { languageId: langId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setLanguage(newLang);
      if (coords) fetchPrayers(coords.lat, coords.lon);
      await loadTranslations(newLang);
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setIsChanging(false);
    }
  };

  return {
    language,
    changeLanguage,
    languageLabel:
      language === "ar" ? translations?.arabic : translations?.english,
    isChanging,
  };
};
