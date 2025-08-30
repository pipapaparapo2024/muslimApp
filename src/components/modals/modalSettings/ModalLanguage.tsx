import React from "react";
import styles from "./ModalLanguage.module.css";
import { Check } from "lucide-react";
import en from "../../../assets/icons/united-king.svg";
import ar from "../../../assets/icons/saudi-arab.svg";
interface LanguageModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentLanguage?: "en" | "ar";
  onLanguageChange?: (lang: "en" | "ar") => void;
}

export const ModalLanguage: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentLanguage = "en",
  onLanguageChange,
}) => {
  if (!isOpen) return null;

  const languages = [
    { code: "en", name: "English", url: en },
    { code: "ar", name: "Arabic", url: ar },
  ] as const;

  // В ModalLanguage компоненте
  const handleSelect = async (lang: "en" | "ar") => {
    try {
      await onLanguageChange?.(lang);
      onClose?.();
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Language</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>
          Select your preferred language for the app.
        </p>

        <div className={styles.options}>
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`${styles.optionBlock} ${
                currentLanguage === lang.code ? styles.selected : ""
              }`}
              onClick={() => handleSelect(lang.code)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(lang.code);
                }
              }}
            >
              <div className={styles.option}>
                <span className={styles.flag}>
                  <img src={lang.url} alt={lang.name} />
                </span>
                <span className={styles.optionText}>{lang.name}</span>
              </div>
              {currentLanguage === lang.code && <Check size={20} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
