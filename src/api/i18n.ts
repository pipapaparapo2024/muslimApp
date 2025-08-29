// i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appSettings: "App Settings",
      region: "Region",
      language: "Language",
    },
  },
  ar: {
    translation: {
      appSettings: "إعدادات التطبيق",
      region: "المنطقة",
      language: "اللغة",
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // язык по умолчанию
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;