import { t } from "i18next";
import { useEffect, useState } from "react";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];
export const DEFAULT_THEME = THEMES.SYSTEM;

export const THEME_VARIANTS = [
  { id: THEMES.LIGHT, name: "Light" },
  { id: THEMES.DARK, name: "Dark" },
  { id: THEMES.SYSTEM, name: "System" },
];

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(
    "light"
  );
  const [isInitialized, setIsInitialized] = useState(false); // 🔥 новое состояние

  const getSystemTheme = (): "light" | "dark" => {
    // Сначала проверяем Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg?.colorScheme) {
      return tg.colorScheme === "dark" ? "dark" : "light";
    }

    // Если Telegram не готов — fallback на prefers-color-scheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const applyThemeStyles = (theme: "light" | "dark") => {
    document.documentElement.classList.remove("light", "dark");
    document.body.classList.remove("light", "dark");

    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
  };

  const updateEffectiveTheme = (selectedTheme: Theme) => {
    let newEffectiveTheme: "light" | "dark";

    if (selectedTheme === "system") {
      newEffectiveTheme = getSystemTheme();
    } else {
      newEffectiveTheme = selectedTheme;
    }

    setEffectiveTheme(newEffectiveTheme);
    applyThemeStyles(newEffectiveTheme);
    return newEffectiveTheme;
  };

  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme =
        (localStorage.getItem("preferred-theme") as Theme) || DEFAULT_THEME;
      setTheme(savedTheme);

      const finalTheme = updateEffectiveTheme(savedTheme);
      setEffectiveTheme(finalTheme);
      setIsInitialized(true); // 🔥 Готово
    };

    // Если Telegram WebApp уже загружен — инициализируем сразу
    if (window.Telegram?.WebApp?.ready) {
      initializeTheme();
    } else {
      // Иначе ждём, пока Telegram инициализируется
      const checkTg = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(checkTg);
          initializeTheme();
        }
      }, 50);
    }

    // Следим за изменениями системной темы
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        updateEffectiveTheme("system");
      }
    };
    media.addEventListener("change", handler);

    return () => {
      media.removeEventListener("change", handler);
      let checkTg: ReturnType<typeof setInterval> | null = null;

      checkTg = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(checkTg!);
          checkTg = null;
          initializeTheme();
        }
      }, 50);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("preferred-theme", newTheme);
    updateEffectiveTheme(newTheme);
  };

  return {
    theme: effectiveTheme, // возвращает "light" или "dark"
    rawTheme: theme, // возвращает текущую настройку: "light", "dark", "system"
    changeTheme,
    themeLabel:
      theme === "system"
        ? t("system")
        : theme === "light"
        ? t("light")
        : t("dark"),
    isThemeReady: isInitialized, // 🔥 можно использовать для отложенного рендера
  };
};
