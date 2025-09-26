import React from "react";
import styles from "./PrayerTimes.module.css";
import { usePrayerApiStore } from "../../../hooks/usePrayerApiStore";
import { useGeoStore } from "../../../hooks/useGeoStore";
import { ModalPrayer } from "../../../components/modals/modalPrayer/ModalPrayer";
import { useNavigate } from "react-router-dom";
import { Pen } from "lucide-react";
import { useDataTimeStore } from "../../../hooks/useDataTimeStore";
import { t } from "i18next";
import { usePrayerTimesLogic, toDate } from "./usePrayerTimesLogic";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { trackButtonClick } from "../../../api/analytics";
export const PrayerTimes: React.FC = () => {
  const { isLoading, error, fetchPrayers, prayers } = usePrayerApiStore();
  const geoData = useGeoStore((state) => state);
  const is24Hour = useDataTimeStore((state) => state.is24Hour);
  const navigate = useNavigate();

  const {
    isModalOpen,
    selectedPrayer,
    sortedPrayers,
    handlePrayerClick,
    handleCloseModal,
    formatTime,
    getMinutesUntilPrayer,
    isPrayerPassed,
  } = usePrayerTimesLogic({
    prayers,
    isLoading,
    error,
    fetchPrayers,
    geoCoords: geoData.coords,
    is24Hour,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (prayers.length === 0) {
    return (
      <div className={styles.prayerTimesContainer}>
        <div className={styles.headerRow}>
          <div className={styles.title}>{t("prayerTimes")}</div>
          <Pen
            size={16}
            onClick={() => navigate("/settings/prayerTimes")}
            className={styles.editIcon}
          />
        </div>
        <div className={styles.subtitle}>{t("viewTodaysSalah")}</div>
        <div className={styles.noPrayers}>{t("noPrayersAvailable")}</div>
      </div>
    );
  }

  return (
    <div className={styles.prayerTimesContainer}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{t("prayerTimes")}</span>
        <div className={styles.actions}>
          <Pen
            size={16}
            onClick={() => navigate("/settings/prayerTimes")}
            className={styles.editIcon}
          />
        </div>
      </div>
      <div className={styles.subtitle}>{t("viewTodaysSalah")}</div>

      <div className={styles.grid}>
        {sortedPrayers.map((prayer) => {
          const minutesUntil = getMinutesUntilPrayer(prayer.time);
          const isNear = minutesUntil <= 5 && minutesUntil > 0;
          const isPassed = isPrayerPassed(prayer.time);
          const time = prayer.time ? formatTime(toDate(prayer.time)!) : "—:— —";

          return (
            <div
              key={prayer.id}
              onClick={() => {
                trackButtonClick("prayer_card_click", {
                  prayer_name: prayer.name,
                  prayer_id: prayer.id,
                  time: prayer.time,
                  minutes_until: minutesUntil,
                  is_near: isNear,
                  is_passed: isPassed,
                });
                handlePrayerClick(prayer);
              }}
              className={`${styles.prayerCard} ${
                isNear ? styles.nearPrayer : ""
              } ${isPassed ? styles.passedPrayer : ""}`}
            >
              {isNear && (
                <div className={styles.countdownBanner}>
                  {t("in")} {minutesUntil} {t("minutes")}
                </div>
              )}
              <div className={styles.prayerName}>{t(prayer.name)}</div>
              <div className={styles.prayerTime}>{time}</div>
            </div>
          );
        })}
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
