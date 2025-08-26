import React, { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import styles from "./Settings.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useNavigate } from "react-router-dom";
import { usePrayerTimesStore } from "./appSettings/SettingPlayerTimes/SettingPlayerTimesStore";
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

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {prayers} = usePrayerTimesStore();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const {
    theme: currentTheme,
    changeTheme,
    themeLabel,
    getIconColor,
  } = useTheme();
  const visiblePrayers = prayers.filter((p) => p.showOnMain);

  return (
    <PageWrapper showBackButton>
      <div className={styles.settingsContainer}>
        {/* === App Settings === */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>App Settings</h2>

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
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
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
              <div className={styles.description}>
                {currentLanguage === "en" ? "English" : "Arabic"}
              </div>
            </div>
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Date & Time */}
          <div
            className={styles.settingItem}
            onClick={() => navigate("/settings/date-time")}
          >
            <div className={styles.iconWrapper}>
              <Calendar strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Date & Time</div>
              <div className={styles.description}>? Selected</div>
            </div>
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Prayer Times */}
          <div
            className={styles.settingItem}
            onClick={() => navigate("/settings/prayer-times")}
          >
            <div className={styles.iconWrapper}>
              <Clock strokeWidth={1.5} color={getIconColor()} />
            </div>
            <div className={styles.content}>
              <div className={styles.title}>Prayer Times</div>
              <div className={styles.description}>{visiblePrayers.length} Selected</div>
            </div>
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
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
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        {/* === Important Links === */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Important Links</h2>

          {/* Privacy Policy */}
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
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Terms Of Use */}
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
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Contact Us */}
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
            <div className={styles.description}>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Language Modal */}
      <ModalLanguage
        isOpen={isLanguageModalOpen}
        currentLanguage={currentLanguage}
        onClose={() => setIsLanguageModalOpen(false)}
        onLanguageChange={(lang) => {
          setCurrentLanguage(lang);
          setIsLanguageModalOpen(false);
          // Здесь можно добавить логику сохранения языка
        }}
      />

      {/* Theme Modal */}
      <ModalTheme
        isOpen={isThemeModalOpen}
        currentTheme={currentTheme}
        onClose={() => setIsThemeModalOpen(false)}
        onThemeChange={(theme) => {
          changeTheme(theme);
          setIsThemeModalOpen(false);
        }}
      />
    </PageWrapper>
  );
};
