import React from "react";
import styles from "./ModalLanguage.module.css";
import arab from "../../../assets/icons/saudi-arab.svg";
import engl from "../../../assets/icons/united-king.svg";
import { Check } from "lucide-react";
interface LanguageModalProps {
  isOpen?: boolean;
  currentLanguage?: string;
  onClose?: () => void;
  onLanguageChange?: (language: string) => void;
}

// Маппинг флагов к языкам
const languageFlags: Record<string, string> = {
  en: engl,
  ar: arab, // можно заменить на 🇪🇬, если важнее Египет
};

export const ModalLanguage: React.FC<LanguageModalProps> = ({
  isOpen,
  currentLanguage = "en",
  onClose,
  onLanguageChange,
}) => {
  if (!isOpen) return null;

  const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "Arabic" },
  ];

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
          {languages.map((language) => (
            <div
              key={language.code}
              className={`${styles.optionBlock} ${
                currentLanguage === language.code ? styles.selected : ""
              }`}
              onClick={() => onLanguageChange?.(language.code)}
            >
              {/* Флаг (эмодзи) */}
              <div className={styles.option}>
                <span className={styles.flag}>
                  <img src={languageFlags[language.code]} />
                </span>
                <span className={styles.optionText}>{language.name}</span>
              </div>
              {currentLanguage === language.code && (
                <div><Check/></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
