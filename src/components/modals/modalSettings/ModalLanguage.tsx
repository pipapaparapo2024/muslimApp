import React, { useEffect, useState } from "react";
import styles from "./ModalLanguage.module.css";
import { Check, Loader } from "lucide-react";
import { t } from "i18next";
import { type Language } from "../../../hooks/useLanguages";
import { useSurahListStore } from "../../../hooks/useSurahListStore";
import { trackButtonClick } from "../../../api/global";

// Импортируем иконки
import enIcon from "../../../assets/icons/united-king.svg";
import arIcon from "../../../assets/icons/saudi-arab.svg";

interface LanguageModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

interface LanguageItem {
  code: Language;
  name: string;
  iconUrl: string;
}

export const ModalLanguage: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentLanguage = "en",
  onLanguageChange,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { fetchVariants } = useSurahListStore();

  const languages: LanguageItem[] = [
    { code: "en" as Language, name: t("english"), iconUrl: enIcon },
    { code: "ar" as Language, name: t("arabic"), iconUrl: arIcon },
  ];

  // Прогрузка иконок
  useEffect(() => {
    let isMounted = true;
    
    const preloadIcons = () => {
      const imagePromises = languages.map((item) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = item.iconUrl;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      });

      Promise.all(imagePromises).then(() => {
        if (isMounted) setIsLoaded(true);
      });
    };

    if (isOpen) {
      if (isLoaded) return;
      preloadIcons();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isLoaded, languages]);

  const handleSelect = (lang: Language) => {
    // 📊 Аналитика: пользователь выбрал язык
    trackButtonClick("select_language_in_modal", {
      from: currentLanguage,
      to: lang,
    });

    onLanguageChange?.(lang);
    onClose?.();
  };

  useEffect(() => {
    if (isOpen) {
      fetchVariants();
    }
  }, [isOpen, fetchVariants]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("languageModal")}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>{t("selectLanguages")}</p>

        <div className={styles.options}>
          {!isLoaded ? (
            <div className={styles.loadingContainer}>
              <Loader size={24} className={styles.spinner} />
              <span>{t("loadingLanguages")}</span>
            </div>
          ) : (
            languages.map((lang) => (
              <div
                key={lang.code}
                className={`${styles.optionBlock} ${
                  currentLanguage === lang.code ? styles.selected : ""
                }`}
                onClick={() => handleSelect(lang.code)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSelect(lang.code);
                }}
              >
                <div className={styles.option}>
                  <span className={styles.flag}>
                    <img 
                      src={lang.iconUrl} 
                      alt={lang.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </span>
                  <span className={styles.optionText}>{lang.name}</span>
                </div>
                {currentLanguage === lang.code && <Check size={20} />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};