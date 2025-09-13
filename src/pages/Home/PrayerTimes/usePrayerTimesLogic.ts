import { useState, useEffect, useMemo } from "react";
import { type Prayers } from "../../../hooks/usePrayerApiStore";

export const toDate = (
  input: string | Date | undefined | null
): Date | null => {
  if (!input) return null;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
};

export interface UsePrayerTimesLogicProps {
  prayers: Prayers[];
  isLoading: boolean;
  error: string | null;
  fetchPrayers: (lat: number, lon: number) => Promise<void>;
  geoCoords: { lat: number; lon: number } | null;
  is24Hour: boolean;
}

export interface UsePrayerTimesLogicReturn {
  isModalOpen: boolean;
  selectedPrayer: Prayers | null;
  now: Date;
  sortedPrayers: Prayers[];
  handlePrayerClick: (prayer: Prayers) => void;
  handleCloseModal: () => void;
  formatTime: (date: Date) => string;
  getMinutesUntilPrayer: (prayerTime: string | Date | undefined) => number;
  isPrayerPassed: (prayerTime: string | Date | undefined) => boolean;
}

export const usePrayerTimesLogic = ({
  prayers,
  fetchPrayers,
  geoCoords,
  is24Hour,
}: UsePrayerTimesLogicProps): UsePrayerTimesLogicReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayers | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Загрузка молитв при изменении геопозиции
  useEffect(() => {
    if (geoCoords) {
      fetchPrayers(geoCoords.lat, geoCoords.lon);
    }
  }, [geoCoords]);

  const formatTime = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "—:— —";
    }

    if (is24Hour) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${hour12}:${formattedMinutes} ${ampm}`;
    }
  };

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

  const isPrayerPassed = (prayerTime: string | Date | undefined): boolean => {
    const date = toDate(prayerTime);
    if (!date) return false;

    const prayerTotal = date.getHours() * 60 + date.getMinutes();
    const currentTotal = now.getHours() * 60 + now.getMinutes();

    return prayerTotal < currentTotal;
  };

  const sortedPrayers = useMemo(() => {
    return [...prayers].sort((a, b) => {
      const aPassed = isPrayerPassed(a.time);
      const bPassed = isPrayerPassed(b.time);

      if (aPassed && !bPassed) return 1;
      if (!aPassed && bPassed) return -1;

      const aTime = toDate(a.time)?.getTime() || 0;
      const bTime = toDate(b.time)?.getTime() || 0;
      return aTime - bTime;
    });
  }, [prayers, now]);

  const handlePrayerClick = (prayer: Prayers) => {
    setSelectedPrayer(prayer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrayer(null);
  };

  return {
    isModalOpen,
    selectedPrayer,
    now,
    sortedPrayers,
    handlePrayerClick,
    handleCloseModal,
    formatTime,
    getMinutesUntilPrayer,
    isPrayerPassed,
  };
};