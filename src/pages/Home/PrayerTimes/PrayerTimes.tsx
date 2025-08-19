// PrayerTimes.tsx
import React, { useMemo, useState } from "react";
import styles from "./PrayerTimes.module.css";
import { usePrayerTimesStore } from "../../Settings/appSettings/SettingPlayerTimes/SettingPlayerTimesStore";
import { ModalPrayer } from "../../../components/modals/modalPrayer/ModalPrayer";
import { type PrayerSetting } from "../../Settings/appSettings/SettingPlayerTimes/SettingPlayerTimesStore";
import { useNavigate } from "react-router-dom";
import { Pen } from "lucide-react";
export const PrayerTimes: React.FC = () => {
  const prayers = usePrayerTimesStore((state) => state.prayers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerSetting | null>(
    null
  );
  const navigate = useNavigate();
  const visiblePrayers = useMemo(
    () => prayers.filter((p) => p.showOnMain),
    [prayers]
  );

  const handlePrayerClick = (prayer: PrayerSetting) => {
    setSelectedPrayer(prayer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrayer(null);
  };

  return (
    <div className={styles.prayerTimesContainer}>
      <div className={styles.headerRow}>
        <span className={styles.title}>Prayer Times</span>
        <span className={styles.editIcon}>
          <Pen size={16} onClick={() => navigate("/settings/prayer-times")} />
        </span>
      </div>

      <div className={styles.subtitle}>
        View today's Salah times and upcoming prayers.
      </div>

      <div className={styles.grid}>
        {visiblePrayers.length > 0 ? (
          visiblePrayers.map((prayer) => (
            <div
              onClick={() => handlePrayerClick(prayer)}
              key={prayer.id}
              className={`${styles.prayerCard} ${
                prayer.isNext ? styles.nextPrayer : ""
              }`}
            >
              <div className={styles.prayerName}>{prayer.name}</div>
              <div className={styles.prayerTime}>{prayer.time}</div>
            </div>
          ))
        ) : (
          <div className={styles.noPrayers}>No prayers available</div>
        )}
      </div>

      {selectedPrayer && (
        <ModalPrayer
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          prayer={selectedPrayer}
        />
      )}
    </div>
  );
};
