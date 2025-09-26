import React, { useEffect, useState } from "react";
import styles from "./SettingPrayerTimes.module.css";
import { usePrayerApiStore } from "../../../../hooks/usePrayerApiStore";
import { t } from "i18next";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { ModalPrayer } from "../../../../components/modals/modalPrayer/ModalPrayer";
import { Info } from "lucide-react";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useGeoStore } from "../../../../hooks/useGeoStore";
import { trackButtonClick } from "../../../api/analytics";

export const SettingPrayerTimes: React.FC = () => {
  const {
    prayerSetting,
    isLoading,
    togglePrayerSelection,
    togglePrayerNotification,
    setAllPrayersSelected,
    setAllNotifications,
    fetchPrayerSettings,
    fetchPrayers,
  } = usePrayerApiStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const { coords: geoCoords } = useGeoStore();

  useEffect(() => {
    if (geoCoords) {
      fetchPrayers(geoCoords.lat, geoCoords.lon);
    }
  }, [geoCoords]);

  useEffect(() => {
    const loadSettings = async () => {
      setLocalLoading(true);
      await fetchPrayerSettings();
      setLocalLoading(false);
    };

    loadSettings();
  }, [fetchPrayerSettings]);

  const handleSelectAll = async () => {
    setLocalLoading(true);
    await setAllPrayersSelected(true);
    trackButtonClick("toggle_all_prayers", { enabled: true });
    setLocalLoading(false);
  };

  const handleDeselectAll = async () => {
    setLocalLoading(true);
    await setAllPrayersSelected(false);
    trackButtonClick("toggle_all_prayers", { enabled: false });
    setLocalLoading(false);
  };

  const handleEnableAllNotifications = async () => {
    setLocalLoading(true);
    await setAllNotifications(true);
    trackButtonClick("toggle_all_notifications", { enabled: true });
    setLocalLoading(false);
  };

  const handleDisableAllNotifications = async () => {
    setLocalLoading(true);
    await setAllNotifications(false);
    trackButtonClick("toggle_all_notifications", { enabled: false });
    setLocalLoading(false);
  };

  const handleInfoClick = (prayer: any) => {
    // 📊 Аналитика: открытие информации о намазе
    trackButtonClick("open_prayer_info_modal", {
      prayer_id: prayer.id,
      prayer_name: prayer.name,
    });
    setSelectedPrayer(prayer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrayer(null);
  };

  const handleToggleSelection = async (id: string, name: string) => {
    setLocalLoading(true);
    const current = prayerSetting.find(p => p.id === id);
    const newEnabled = !current?.hasSelected;
    await togglePrayerSelection(id);
    trackButtonClick("toggle_single_prayer", {
      prayer_id: id,
      prayer_name: name,
      enabled: newEnabled,
    });
    setLocalLoading(false);
  };

  const handleToggleNotification = async (id: string, name: string) => {
    setLocalLoading(true);
    const current = prayerSetting.find(p => p.id === id);
    const newEnabled = !current?.hasTelegramNotification;
    await togglePrayerNotification(id);
    trackButtonClick("toggle_single_prayer_notification", {
      prayer_id: id,
      prayer_name: name,
      enabled: newEnabled,
    });
    setLocalLoading(false);
  };

  const allPrayersEnabled =
    prayerSetting.length > 0
      ? prayerSetting.every((prayer) => prayer.hasSelected)
      : false;

  const allNotificationsEnabled =
    prayerSetting.length > 0
      ? prayerSetting
          .filter((prayer) => prayer.hasSelected)
          .every((prayer) => prayer.hasTelegramNotification)
      : false;

  const handleToggleAllPrayers = async () => {
    if (allPrayersEnabled) {
      await handleDeselectAll();
    } else {
      await handleSelectAll();
    }
  };

  const handleToggleAllNotifications = async () => {
    if (allNotificationsEnabled) {
      await handleDisableAllNotifications();
    } else {
      await handleEnableAllNotifications();
    }
  };

  if (isLoading || localLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (prayerSetting.length === 0) {
    return (
      <div className={styles.settingsContainer}>
        <div className={styles.loading}>{t("noSettingsAvailable")}</div>
      </div>
    );
  }

  return (
    <PageWrapper showBackButton navigateTo="/settings">
      <div>
        <h1 className={styles.title}>{t("prayerTimes")}</h1>
        <p className={styles.subtitle}>{t("choosePrayers")}</p>

        {/* Глобальные переключатели */}
        <div className={styles.globalControls}>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleItem}>
              <span className={styles.showMain}>{t("showAllPrayerTimes")}</span>
              <input
                type="checkbox"
                checked={allPrayersEnabled}
                onChange={handleToggleAllPrayers}
                className={styles.toggleInput}
                disabled={localLoading}
              />
              <span className={styles.toggleSlider}></span>
            </label>

            <label className={styles.toggleItem}>
              <span>{t("getAllTelegramNotifications")}</span>
              <input
                type="checkbox"
                checked={allNotificationsEnabled}
                onChange={handleToggleAllNotifications}
                className={styles.toggleInput}
                disabled={!allPrayersEnabled || localLoading}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.prayerList}>
          {prayerSetting.map((prayer) => (
            <div key={prayer.id} className={styles.prayerItem}>
              <div className={styles.prayerHeader}>
                <div className={styles.prayerName}>{t(prayer.name)}</div>
                <div className={styles.headerIconInfo}>
                  <Info
                    size={18}
                    className={styles.infoButton}
                    onClick={() => handleInfoClick(prayer)}
                  />
                </div>
              </div>

              <div className={styles.toggleGroup}>
                <label className={styles.toggleItem}>
                  <span className={styles.showMain}>
                    {t("showOnMainScreen")}
                  </span>
                  <input
                    type="checkbox"
                    checked={prayer.hasSelected}
                    onChange={() => handleToggleSelection(prayer.id, prayer.name)}
                    className={styles.toggleInput}
                    disabled={localLoading}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>

                <label className={styles.toggleItem}>
                  <span>{t("getTelegramNotifications")}</span>
                  <input
                    type="checkbox"
                    checked={prayer.hasTelegramNotification}
                    onChange={() => handleToggleNotification(prayer.id, prayer.name)}
                    className={styles.toggleInput}
                    disabled={!prayer.hasSelected || localLoading}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {selectedPrayer && (
          <ModalPrayer
            isOpen={isModalOpen}
            onRequestClose={handleCloseModal}
            prayer={selectedPrayer}
          />
        )}
      </div>
    </PageWrapper>
  );
};