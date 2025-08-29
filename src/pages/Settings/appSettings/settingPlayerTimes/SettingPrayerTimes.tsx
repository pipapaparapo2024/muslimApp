import React, { useState } from "react";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { ModalPrayer } from "../../../../components/modals/modalPrayer/ModalPrayer";
import styles from "./SettingPlayerTimes.module.css";
import { type PrayerSetting } from "./SettingPrayerTimesStore";
import { usePrayerTimesStore } from "./SettingPrayerTimesStore";
import { Info } from "lucide-react";

export const SettingPrayerTimes: React.FC = () => {
  const {
    prayers,
    toggleShowOnMain,
    toggleTelegramNotifications,
    setAllPrayers,
    setAllNotifications,
  } = usePrayerTimesStore();

  const [selectedPrayer, setSelectedPrayer] = useState<PrayerSetting | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInfoClick = (prayer: PrayerSetting) => {
    setSelectedPrayer(prayer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const allPrayersEnabled = prayers.every((p) => p.showOnMain);
  const allNotificationsEnabled = prayers.every((p) => p.telegramNotifications);

  const handleToggleAllPrayers = () => {
    const newState = !allPrayersEnabled;
    setAllPrayers(newState);

    // Если включаем все молитвы, автоматически включаем и уведомления
    if (newState) {
      setAllNotifications(true);
    }
  };

  const handleToggleAllNotifications = () => {
    setAllNotifications(!allNotificationsEnabled);
  };

  return (
    <PageWrapper showBackButton>
      <div>
        <h1 className={styles.title}>Prayer Times</h1>
        <p className={styles.subtitle}>
          Choose the prayers you want to monitor.
        </p>

        {/* Глобальные переключатели */}
        <div className={styles.globalControls}>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleItem}>
              <span className={styles.showMain}>Show All Prayer Times</span>
              <input
                type="checkbox"
                checked={allPrayersEnabled}
                onChange={handleToggleAllPrayers}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
            </label>

            <label className={styles.toggleItem}>
              <span>Get All Telegram Notifications</span>
              <input
                type="checkbox"
                checked={allNotificationsEnabled}
                onChange={handleToggleAllNotifications}
                className={styles.toggleInput}
                disabled={!allPrayersEnabled}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.prayerList}>
          {prayers.map((prayer) => (
            <div key={prayer.id} className={styles.prayerItem}>
              <div className={styles.prayerHeader}>
                <div className={styles.prayerName}>{prayer.name}</div>
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
                  <span className={styles.showMain}>Show On Main Screen</span>
                  <input
                    type="checkbox"
                    checked={prayer.showOnMain}
                    onChange={() => toggleShowOnMain(prayer.id)}
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>

                <label className={styles.toggleItem}>
                  <span>Get Telegram Notifications</span>
                  <input
                    type="checkbox"
                    checked={prayer.telegramNotifications}
                    onChange={() => toggleTelegramNotifications(prayer.id)}
                    className={styles.toggleInput}
                    disabled={!prayer.showOnMain}
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
