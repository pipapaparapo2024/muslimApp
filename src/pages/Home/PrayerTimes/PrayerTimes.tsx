import React, { useState, useEffect, useMemo } from "react";
import styles from "./PrayerTimes.module.css";
import { usePrayerTimesStore } from "../../Settings/appSettings/settingPlayerTimes/SettingPlayerTimesStore";
import { useGeoStore } from "../../Home/GeoStore";
import { ModalPrayer } from "../../../components/modals/modalPrayer/ModalPrayer";
import { type PrayerSetting } from "../../Settings/appSettings/settingPlayerTimes/SettingPlayerTimesStore";
import { useNavigate } from "react-router-dom";
import { Pen } from "lucide-react";
import { useDataTimeStore } from "../../Settings/appSettings/dataTime/DataTimeStore";

// Помогает конвертировать строку или Date в объект Date
const toDate = (input: string | Date | undefined | null): Date | null => {
  if (!input) return null;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
};

export const PrayerTimes: React.FC = () => {
  const prayers = usePrayerTimesStore((state) => state.prayers);
  const isLoading = usePrayerTimesStore((state) => state.isLoading);
  const lastUpdated = usePrayerTimesStore((state) => state.lastUpdated);
  const is24Hour = useDataTimeStore();
  // Обновляем функцию formatTime для поддержки обоих форматов
  const formatTime = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date passed to formatTime:", date);
      return "—:— —";
    }

    if (is24Hour) {
      // 24-часовой формат: 14:30
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      // 12-часовой формат: 2:30 PM
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${hour12}:${formattedMinutes} ${ampm}`;
    }
  };
  const calculatePrayerTimes = usePrayerTimesStore(
    (state) => state.calculatePrayerTimes
  );
  const updatePrayerTimes = usePrayerTimesStore(
    (state) => state.updatePrayerTimes
  );

  const geoData = useGeoStore((state) => state);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerSetting | null>(
    null
  );
  const navigate = useNavigate();

  // Текущее время (обновляется каждую минуту)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Каждую минуту

    return () => clearInterval(timer);
  }, []);

  // Разница в минутах до молитвы
  const getMinutesUntilPrayer = (
    prayerTime: string | Date | undefined
  ): number => {
    const date = toDate(prayerTime);
    if (!date) return 999;

    const prayerTotal = date.getHours() * 60 + date.getMinutes();
    const currentTotal = now.getHours() * 60 + now.getMinutes();

    return prayerTotal >= currentTotal
      ? prayerTotal - currentTotal
      : prayerTotal + 24 * 60 - currentTotal;
  };

  // Проверяет, прошла ли уже молитва сегодня
  const isPrayerPassed = (prayerTime: string | Date | undefined): boolean => {
    const date = toDate(prayerTime);
    if (!date) return false;

    const prayerTotal = date.getHours() * 60 + date.getMinutes();
    const currentTotal = now.getHours() * 60 + now.getMinutes();

    return prayerTotal < currentTotal;
  };

  // Сортируем молитвы: сначала будущие, потом прошедшие
  const sortedVisiblePrayers = useMemo(() => {
    const visiblePrayers = prayers.filter((p) => p.showOnMain);

    return visiblePrayers.sort((a, b) => {
      const aPassed = isPrayerPassed(a.calculatedTime);
      const bPassed = isPrayerPassed(b.calculatedTime);

      if (aPassed && !bPassed) return 1; // a прошедшая, b будущая → a после b
      if (!aPassed && bPassed) return -1; // a будущая, b прошедшая → a перед b

      // Если оба будущие или оба прошедшие, сортируем по времени
      const aTime = toDate(a.calculatedTime)?.getTime() || 0;
      const bTime = toDate(b.calculatedTime)?.getTime() || 0;
      return aTime - bTime;
    });
  }, [prayers, now]);

  // Инициализация или обновление времени молитв
  useEffect(() => {
    const initializePrayerTimes = async () => {
      if (geoData.coords && prayers.length === 0) {
        await calculatePrayerTimes();
        return;
      }

      if (
        lastUpdated &&
        new Date(lastUpdated).getTime() + 24 * 60 * 60 * 1000 < Date.now()
      ) {
        await updatePrayerTimes();
      }
    };

    initializePrayerTimes();
  }, [
    geoData.coords,
    calculatePrayerTimes,
    updatePrayerTimes,
    prayers.length,
    lastUpdated,
  ]);

  const handlePrayerClick = (prayer: PrayerSetting) => {
    setSelectedPrayer(prayer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrayer(null);
  };

  if (isLoading) {
    return (
      <div className={styles.prayerTimesContainer}>
        <div className={styles.headerRow}>
          <span className={styles.title}>Prayer Times</span>
        </div>
        <div className={styles.subtitle}>Calculating prayer times...</div>
      </div>
    );
  }

  return (
    <div className={styles.prayerTimesContainer}>
      <div className={styles.headerRow}>
        <span className={styles.title}>Prayer Times</span>
        <div className={styles.actions}>
          <Pen
            size={16}
            onClick={() => navigate("/settings/prayerTimes")}
            className={styles.editIcon}
          />
        </div>
      </div>
      <div className={styles.subtitle}>
        View today's Salah times and upcoming prayers.
      </div>

      <div className={styles.grid}>
        {sortedVisiblePrayers.map((prayer) => {
          const minutesUntil = getMinutesUntilPrayer(prayer.calculatedTime);
          const isNear = minutesUntil <= 5 && minutesUntil > 0;
          const isPassed = isPrayerPassed(prayer.calculatedTime);
          const time = prayer.calculatedTime
            ? formatTime(toDate(prayer.calculatedTime)!)
            : "—:— —";

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
                  In {minutesUntil} min
                </div>
              )}
              <div className={styles.prayerName}>{prayer.name}</div>
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
