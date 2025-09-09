import { t } from "i18next";
import { useEffect, useState, useCallback } from "react";

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
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState(false);

  // Мемоизируем функцию для получения системной темы
  const getSystemTheme = useCallback((): "light" | "dark" => {
    const tg = window.Telegram?.WebApp;
    if (tg?.colorScheme) {
      return tg.colorScheme === "dark" ? "dark" : "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Мемоизируем функцию применения стилей
  const applyThemeStyles = useCallback((theme: "light" | "dark") => {
    document.documentElement.classList.remove("light", "dark");
    document.body.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
  }, []);

  // Мемоизируем функцию обновления эффективной темы
  const updateEffectiveTheme = useCallback((selectedTheme: Theme) => {
    const newEffectiveTheme = selectedTheme === "system" 
      ? getSystemTheme() 
      : selectedTheme;
    
    setEffectiveTheme(newEffectiveTheme);
    applyThemeStyles(newEffectiveTheme);
    return newEffectiveTheme;
  }, [getSystemTheme, applyThemeStyles]);

  // Инициализация темы
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = (localStorage.getItem("preferred-theme") as Theme) || DEFAULT_THEME;
      setTheme(savedTheme);
      updateEffectiveTheme(savedTheme);
      setIsInitialized(true);
    };

    if (window.Telegram?.WebApp?.ready) {
      initializeTheme();
    } else {
      const checkTg = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(checkTg);
          initializeTheme();
        }
      }, 50);
    }
  }, [updateEffectiveTheme]);

  // Слушатель изменений системной темы (только когда theme = "system")
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = () => {
      updateEffectiveTheme("system");
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme, updateEffectiveTheme]);

  // Слушатель изменений Telegram colorScheme (только когда theme = "system")
  useEffect(() => {
    if (theme !== "system" || !window.Telegram?.WebApp) return;

    const handleTgThemeChange = () => {
      updateEffectiveTheme("system");
    };

    // Добавляем слушатель, если Telegram предоставляет такую возможность
    window.Telegram.WebApp.onEvent('themeChanged', handleTgThemeChange);
    
    return () => {
      window.Telegram?.WebApp.offEvent('themeChanged', handleTgThemeChange);
    };
  }, [theme, updateEffectiveTheme]);

  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("preferred-theme", newTheme);
    updateEffectiveTheme(newTheme);
  }, [updateEffectiveTheme]);

  return {
    theme: effectiveTheme,
    rawTheme: theme,
    changeTheme,
    themeLabel: theme === "system" ? t("system") : theme === "light" ? t("light") : t("dark"),
    isThemeReady: isInitialized,
  };
};