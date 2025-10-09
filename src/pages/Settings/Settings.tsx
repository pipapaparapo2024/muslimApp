import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguages";
import styles from "./Settings.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useNavigate } from "react-router-dom";
import { usePrayerApiStore } from "../../hooks/usePrayerApiStore";
import { ModalLanguage } from "../../components/modals/modalSettings/ModalLanguage";
import { ModalTheme } from "../../components/modals/modalSettings/ModalTheme";
import { useTranslationsStore } from "../../hooks/useTranslations";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Languages,
  MessageCircle,
  Shield,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackButtonClick } from "../../api/analytics";

export const Settings: React.FC = () => {
  const { translations } = useTranslationsStore();
  const navigate = useNavigate();
  const { prayers } = usePrayerApiStore();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { i18n } = useTranslation();
  const { rawTheme, changeTheme, themeLabel } = useTheme();
  const { language, changeLanguage, languageLabel } = useLanguage();

  useEffect(() => {
    console.log("Current language:", i18n.language);
    console.log(
      "HTML dir attribute:",
      document.documentElement.getAttribute("dir")
    );
    console.log("HTML classes:", document.documentElement.className);
  }, [i18n.language]);

  // Обработчики с аналитикой
  const openLanguageModal = () => {
    trackButtonClick("settings", "click_language");
    setIsLanguageModalOpen(true);
  };

  const openThemeModal = () => {
    trackButtonClick("settings", "click_theme");
    setIsThemeModalOpen(true);
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <PageWrapper showBackButton>
      <div className={styles.settingsContainer}>
        {/* === App Settings === */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{translations?.appSettings}</h2>

          {/* Language */}
          <div className={styles.settingItem} onClick={openLanguageModal}>
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <Languages
                  strokeWidth={1.5}
                  color="var(--color-icon-secondary)"
                />
              </div>
              <div className={styles.title}>{translations?.language}</div>
            </div>
            <div className={styles.settingItemRight}>
              <div className={styles.description}>{languageLabel}</div>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div
            className={styles.settingItem}
            onClick={() => {
              trackButtonClick("settings", "click_date_time");
              navigateTo("/settings/dateTime");
            }}
          >
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <Calendar
                  strokeWidth={1.5}
                  color="var(--color-icon-secondary)"
                />
              </div>
              <div className={styles.title}>{translations?.dateTime}</div>
            </div>
            <div className={styles.settingItemRight}>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>

          {/* Prayer Times */}
          <div
            className={styles.settingItem}
            onClick={() => {
              trackButtonClick("settings", "click_prayer_times");
              navigateTo("/settings/prayerTimes");
            }}
          >
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <Clock strokeWidth={1.5} color="var(--color-icon-secondary)" />
              </div>
              <div className={styles.title}>{translations?.prayerTimes}</div>
            </div>
            <div className={styles.settingItemRight}>
              <div className={styles.description}>
                {prayers.length} {translations?.prayers}
              </div>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>

          {/* Theme */}
          <div className={styles.settingItem} onClick={openThemeModal}>
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <Sun strokeWidth={1.5} color="var(--color-icon-secondary)" />
              </div>
              <div className={styles.title}> {translations?.theme}</div>
            </div>
            <div className={styles.settingItemRight}>
              <div className={styles.description}>{themeLabel}</div>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>
        </div>

        {/* === Important Links === */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {translations?.importantLinks}
          </h2>

          {/* Privacy Policy */}
          <div
            className={styles.settingItem}
            onClick={() => {
              trackButtonClick("settings", "click_privacy_policy");
              navigateTo("/privacy-policy");
            }}
          >
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <Shield strokeWidth={1.5} color="var(--color-icon-secondary)" />
              </div>
              <div className={styles.title}>{translations?.privacyPolicy}</div>
            </div>
            <div className={styles.settingItemRight}>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>

          {/* Terms Of Use */}
          <div
            className={styles.settingItem}
            onClick={() => {
              trackButtonClick("settings", "click_terms_of_use");
              navigateTo("/terms-of-use");
            }}
          >
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <FileText
                  strokeWidth={1.5}
                  color="var(--color-icon-secondary)"
                />
              </div>
              <div className={styles.title}>{translations?.termsOfUse}</div>
            </div>
            <div className={styles.settingItemRight}>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>

          {/* Contact Us */}
          <div
            className={styles.settingItem}
            onClick={() => {
              trackButtonClick("settings", "click_contact_us");
              navigateTo("/contact-us");
            }}
          >
            <div className={styles.settingItemLeft}>
              <div className={styles.iconWrapper}>
                <MessageCircle
                  strokeWidth={1.5}
                  color="var(--color-icon-secondary)"
                />
              </div>
              <div className={styles.title}> {translations?.contactUs}</div>
            </div>
            <div className={styles.settingItemRight}>
              {language === "ar" ? (
                <ChevronLeft size={24} />
              ) : (
                <ChevronRight size={24} />
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalLanguage
        isOpen={isLanguageModalOpen}
        currentLanguage={language}
        onClose={() => setIsLanguageModalOpen(false)}
        onLanguageChange={(newLang) => {
          changeLanguage(newLang);
        }}
      />

      <ModalTheme
        isOpen={isThemeModalOpen}
        currentTheme={rawTheme}
        onClose={() => setIsThemeModalOpen(false)}
        onThemeChange={(theme) => {
          changeTheme(theme);
        }}
      />
    </PageWrapper>
  );
};
