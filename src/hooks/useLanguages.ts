// hooks/useLanguages.ts
import { useState, useEffect, useCallback } from "react";
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
  const [isLoadingLanguage, setIsLoadingLanguage] = useState<boolean>(true);

  // Инициализация: берем язык с бэкенда (если есть), потом подгружаем переводы и применяем стили.
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setIsLoadingLanguage(true);
      try {
        const token = localStorage.getItem("accessToken");
        let backendLang: Language | null = null;

        if (token) {
          try {
            const resp = await quranApi.get(
              "api/v1/settings/languages/selected",
              { headers: { Authorization: `Bearer ${token}` } }
            );
            backendLang = resp?.data?.data?.language?.languageCode as Language;
          } catch (err) {
            // не критично — продолжим с локального или дефолтного
            console.warn("Не удалось получить язык с бэка:", err);
          }
        }

        const preferred: Language =
          (backendLang as Language) ||
          ((localStorage.getItem(LANGUAGE_KEY) as Language) || "en");

        // Ждём пока переводы загрузятся полностью
        await loadTranslations(preferred);

        if (!mounted) return;
        applyLanguageStyles(preferred);
        setLanguage(preferred);
        localStorage.setItem(LANGUAGE_KEY, preferred);
      } catch (err) {
        console.error("Ошибка инициализации языка:", err);
      } finally {
        if (mounted) setIsLoadingLanguage(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTranslations]); // loadTranslations обычно стабилен (из zustand) — OK

  // Переключение языка (вручную)
  const changeLanguage = useCallback(
    async (newLang: Language) => {
      if (newLang === language) return;
      setIsLoadingLanguage(true);

      try {
        // 1) подгружаем переводы
        await loadTranslations(newLang);

        // 2) применяем стили и сохраняем выбор
        applyLanguageStyles(newLang);
        setLanguage(newLang);
        localStorage.setItem(LANGUAGE_KEY, newLang);

        // 3) уведомляем бэкенд (необходимо, если у вас backend хранит выбор)
        const token = localStorage.getItem("accessToken");
        if (token) {
          try {
            const langId = newLang === "ar" ? arabId : enId;
            await quranApi.post(
              "api/v1/settings/languages",
              { languageId: langId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            console.warn("Не удалось уведомить бэкенд о смене языка:", err);
          }
        }

        // 4) при желании — обновим молитвы (если нужно)
        if (coords) {
          try {
            await fetchPrayers(coords.lat, coords.lon);
          } catch (err) {
            console.warn("Failed to refresh prayers after language change:", err);
          }
        }
      } catch (err) {
        console.error("Error changing language:", err);
      } finally {
        setIsLoadingLanguage(false);
      }
    },
    [language, loadTranslations, coords, fetchPrayers]
  );

  // languageLabel (в UI показываем название на текущих переводах, с fallback)
  const languageLabel =
    translations && (translations.english || translations.arabic)
      ? language === "ar"
        ? translations.arabic
        : translations.english
      : language === "ar"
      ? "العربية"
      : "English";

  return {
    language,
    changeLanguage,
    isLoadingLanguage,
    languageLabel,
  };
};
