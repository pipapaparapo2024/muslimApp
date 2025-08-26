import React from "react";
import styles from "./ModalTheme.module.css";
import { Check, Moon, Smartphone, Sun } from "lucide-react";

interface ThemeModalProps {
  isOpen?: boolean;
  currentTheme?: "light" | "dark" | "system";
  onClose?: () => void;
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

export const ModalTheme: React.FC<ThemeModalProps> = ({
  isOpen,
  currentTheme = "system",
  onClose,
  onThemeChange,
}) => {
  if (!isOpen) return null;

  const themes = [
    { id: "light", name: "Light", icon: <Sun size={20} /> },
    { id: "dark", name: "Dark", icon: <Moon size={20} /> },
    { id: "system", name: "System", icon: <Smartphone size={20} /> },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Choose Theme</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <p className={styles.modalDescription}>
          Set your preferred appearance mode.
        </p>
        <div className={styles.options}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`${styles.option} ${
                currentTheme === theme.id ? styles.selected : ""
              }`}
              onClick={() =>
                onThemeChange?.(theme.id as "light" | "dark" | "system")
              }
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
