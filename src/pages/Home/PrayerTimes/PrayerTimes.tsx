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

export const PrayerTimes: React.FC = () => {
  const { isLoading, error, fetchPrayers, fetchPrayerSettings,prayers } =
    usePrayerApiStore();
  const geoData = useGeoStore((state) => state);
  const is24Hour = useDataTimeStore((state) => state.is24Hour);
  const navigate = useNavigate();

  const {
    isModalOpen,
    selectedPrayer,
    sortedVisiblePrayers,
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
    fetchPrayerSettings,
    geoCoords: geoData.coords,
    is24Hour,
  });

  if (error) {
    return (
      <div className={styles.prayerTimesContainer}>
        <div className={styles.error}>
          {t("errorLoadingPrayers")}: {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading</div>;
  }

  if (sortedVisiblePrayers.length === 0) {
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
        <div className={styles.noPrayers}>{t("noPrayersSelected")}</div>
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
        {sortedVisiblePrayers.map((prayer) => {
          const minutesUntil = getMinutesUntilPrayer(prayer.time);
          const isNear = minutesUntil <= 5 && minutesUntil > 0;
          const isPassed = isPrayerPassed(prayer.time);
          const time = prayer.time ? formatTime(toDate(prayer.time)!) : "—:— —";

          return (
            <div
              key={prayer.id}
              onClick={() => handlePrayerClick(prayer)}
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
