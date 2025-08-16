// src/hooks/useTheme.ts
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

    // Устанавливаем CSS-переменные из вашей дизайн-системы
    if (theme === "light") {
      document.documentElement.style.setProperty("--bg-app", "#f5f5f4");
      document.documentElement.style.setProperty("--bg-surface", "#ffffff");
      document.documentElement.style.setProperty("--text", "#222222");
    } else {
      document.documentElement.style.setProperty("--bg-app", "#333333");
      document.documentElement.style.setProperty("--bg-surface", "#111111");
      document.documentElement.style.setProperty("--text", "#ffffff");
    }
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
      const checkTg = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(checkTg);
          initializeTheme();
        }
      }, 50);
      clearInterval(checkTg as any);
    };
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("preferred-theme", newTheme);
    updateEffectiveTheme(newTheme);
  };
  const getIconColor = () => {
    return effectiveTheme === "dark"
      ? "var(--colors-white-1000)"
      : "var(--colors-stone-950)";
  };
  return {
    theme: effectiveTheme, // возвращает "light" или "dark"
    rawTheme: theme, // возвращает текущую настройку: "light", "dark", "system"
    changeTheme,
    getIconColor,
    themeLabel:
      theme === "system" ? "System" : theme === "light" ? "Light" : "Dark",
    isThemeReady: isInitialized, // 🔥 можно использовать для отложенного рендера
  };
};
