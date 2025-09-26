import React from "react";
import styles from "./ModalTheme.module.css";
import { Check, Moon, Smartphone, Sun } from "lucide-react";
import { t } from "i18next";
import { trackButtonClick } from "../../../api/analytics";

interface ThemeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentTheme?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

export const ModalTheme: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme = "system",
  onThemeChange,
}) => {
  if (!isOpen) return null;

  const themes = [
    { id: "light", name: t("light"), icon: <Sun size={20} /> },
    { id: "dark", name: t("dark"), icon: <Moon size={20} /> },
    { id: "system", name: t("system"), icon: <Smartphone size={20} /> },
  ];

  const handleSelect = (theme: "light" | "dark" | "system") => {
    // 📊 Аналитика: пользователь выбрал тему
    trackButtonClick("select_theme_in_modal", {
      from: currentTheme,
      to: theme,
    });

    onThemeChange?.(theme);
    onClose?.();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("chooseTheme")}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <p className={styles.modalDescription}>
          {t("setYourPreferred")}
        </p>
        <div className={styles.options}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`${styles.option} ${
                currentTheme === theme.id ? styles.selected : ""
              }`}
              onClick={() => handleSelect(theme.id as "light" | "dark" | "system")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(theme.id as "light" | "dark" | "system");
                }
              }}
            >
              <div className={styles.optionNameIcon}>
                <div>{theme.icon}</div>
                <span className={styles.optionText}>{theme.name}</span>
              </div>
              {currentTheme === theme.id && <Check />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};