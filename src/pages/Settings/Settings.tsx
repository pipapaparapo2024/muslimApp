import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguages";
import styles from "./Settings.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useNavigate } from "react-router-dom";
import { usePrayerTimesStore } from "./appSettings/settingPlayerTimes/SettingPrayerTimesStore";
import { ModalLanguage } from "../../components/modals/modalSettings/ModalLanguage";
import { ModalTheme } from "../../components/modals/modalSettings/ModalTheme";
import {
  Calendar,
  ChevronRight,
  Clock,
  Earth,
  FileText,
  Languages,
  MessageCircle,
  Shield,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { prayers } = usePrayerTimesStore();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { rawTheme, changeTheme, themeLabel, getIconColor } = useTheme();
  const { language, changeLanguage, languageLabel } = useLanguage();
  console.log("Current language:", i18n.language);
  const visiblePrayers = prayers.filter((p) => p.showOnMain);
  // Временная проверка
  useEffect(() => {
    console.log("Current language:", i18n.language);
    console.log(
      "HTML dir attribute:",
      document.documentElement.getAttribute("dir")
    );
    console.log("HTML classes:", document.documentElement.className);
  }, [i18n.language]);

  return (
    <PageWrapper showBackButton>
      <div className={styles.settingsContainer}>
        {/* === App Settings === */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("appSettings")}</h2>

          {/* Region */}
          <div
            className={styles.settingItem}
            onClick={() => navigate("/settings/region")}
          >
            <div className={styles.iconWrapper}>
              <Earth strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Region</div>
              <div className={styles.description}>Russia, Voronezh</div>
            </div>
            <ChevronRight
              size={20}
            />
          </div>

          {/* Language */}
          <div
            className={styles.settingItem}
            onClick={() => setIsLanguageModalOpen(true)}
          >
            <div className={styles.iconWrapper}>
              <Languages strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Language</div>
              <div className={styles.description}>{languageLabel}</div>
            </div>
            <ChevronRight size={20} />
          </div>

          {/* Date & Time */}
          <div
            className={styles.settingItem}
            onClick={() => navigate("/settings/dateTime")}
          >
            <div className={styles.iconWrapper}>
              <Calendar strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Date & Time</div>
            </div>
            <ChevronRight size={20} />
          </div>

          {/* Prayer Times */}
          <div
            className={styles.settingItem}
            onClick={() => navigate("/settings/prayerTimes")}
          >
            <div className={styles.iconWrapper}>
              <Clock strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Prayer Times</div>
              <div className={styles.description}>
                {visiblePrayers.length} Selected
              </div>
            </div>
            <ChevronRight size={20} />
          </div>

          {/* Theme */}
          <div
            className={styles.settingItem}
            onClick={() => setIsThemeModalOpen(true)}
          >
            <div className={styles.iconWrapper}>
              <Sun strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Theme</div>
              <div className={styles.description}>{themeLabel}</div>
            </div>
            <ChevronRight size={20} />
          </div>
        </div>

        {/* === Important Links === */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Important Links</h2>

          <div
            className={styles.settingItem}
            onClick={() => navigate("/privacy-policy")}
          >
            <div className={styles.iconWrapper}>
              <Shield strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Privacy Policy</div>
            </div>
            <ChevronRight size={20} />
          </div>

          <div
            className={styles.settingItem}
            onClick={() => navigate("/terms-of-use")}
          >
            <div className={styles.iconWrapper}>
              <FileText strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Terms Of Use</div>
            </div>
            <ChevronRight size={20} />
          </div>

          <div
            className={styles.settingItem}
            onClick={() => navigate("/contact-us")}
          >
            <div className={styles.iconWrapper}>
              <MessageCircle strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Contact Us</div>
            </div>
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      {/* ✅ Language Modal — управляемый */}
      <ModalLanguage
        isOpen={isLanguageModalOpen}
        currentLanguage={language}
        onClose={() => setIsLanguageModalOpen(false)}
        onLanguageChange={(lang) => {
          changeLanguage(lang);
        }}
      />

      {/* ✅ Theme Modal — управляемый */}
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
