import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { type Prayers } from "../../hooks/usePrayerApiStore";
import type { Language } from "../../hooks/useLanguages";
import { quranApi } from "../../api/api";
import i18n from "../../api/i18n";
import { applyLanguageStyles } from "../../hooks/useLanguages";
import { t } from "i18next";

export const toDate = (
  input: string | Date | undefined | null
): Date | null => {
  if (!input) return null;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
};

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const fetchLanguageFromBackend = async (): Promise<Language | null> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const response = await quranApi.get("api/v1/settings/languages/selected", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const backendLanguage = response.data.data.language.languageCode;
    return backendLanguage;
  } catch (error) {
    console.error("Error fetching language:", error);
    return null;
  }
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

export interface UseHomeLogicReturn {
  sensorPermission: string;
  isRequestingPermission: boolean;
  isInitializing: boolean;
  languageReady: boolean;
  initializationError: string | null;
  orientationListenerActive: boolean;
  requestSensorPermission: () => Promise<void>;
  resetSensorPermission: () => void;
  handleCompassClick: (currentPermission: string) => Promise<void>;
  handleMapClick: () => void;
}

export interface UseCombinedLogicProps {
  prayers: Prayers[];
  isLoading: boolean;
  error: string | null;
  fetchPrayers: (lat: number, lon: number) => Promise<void>;
  geoCoords: { lat: number; lon: number } | null;
  is24Hour: boolean;
}

export interface UseCombinedLogicReturn extends UsePrayerTimesLogicReturn, UseHomeLogicReturn {
}

export const useCombinedLogic = ({
  prayers,
  fetchPrayers,
  geoCoords,
  is24Hour,
}: UseCombinedLogicProps): UseCombinedLogicReturn => {
  const navigate = useNavigate();
  
  // Состояния для молитв
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayers | null>(null);
  const [now, setNow] = useState(new Date());

  // Состояния для языка и сенсоров
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [orientationListenerActive, setOrientationListenerActive] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);

  // Инициализируем состояние сенсора из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  // Таймер для обновления текущего времени
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 1. ПЕРВЫЙ ЭФФЕКТ: Инициализация языка
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        console.log("Starting language initialization...");
        const userLanguage = await fetchLanguageFromBackend();
        if (userLanguage) {
          await i18n.changeLanguage(userLanguage);
          applyLanguageStyles(userLanguage);
          localStorage.setItem("preferred-language", userLanguage);
          console.log("Language initialized successfully:", userLanguage);
        } else {
          console.log("No language found, using default");
        }
        
        setLanguageReady(true);
      } catch (error) {
        console.error("Language initialization error:", error);
        setInitializationError(error instanceof Error ? error.message : "Language initialization error");
        setLanguageReady(true); // Все равно продолжаем
      } finally {
        setIsInitializing(false);
        console.log("Language initialization completed");
      }
    };

    initializeLanguage();
  }, []);

  // 2. ВТОРОЙ ЭФФЕКТ: Загрузка молитв после инициализации языка
  useEffect(() => {
    if (languageReady && geoCoords) {
      console.log("Language ready, fetching prayers...");
      fetchPrayers(geoCoords.lat, geoCoords.lon);
    }
  }, [languageReady, geoCoords]); // Убрал fetchPrayers из зависимостей

  // Синхронизация состояния сенсора с localStorage
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // Функции для молитв
  const formatTime = useCallback((date: Date): string => {
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
  }, [is24Hour]); // Добавил is24Hour в зависимости

  const getMinutesUntilPrayer = useCallback((
    prayerTime: string | Date | undefined
  ): number => {
    const date = toDate(prayerTime);
    if (!date) return 999;

    const prayerTotal = date.getHours() * 60 + date.getMinutes();
    const currentTotal = now.getHours() * 60 + now.getMinutes();

    return prayerTotal >= currentTotal
      ? prayerTotal - currentTotal
      : prayerTotal + 24 * 60 - currentTotal;
  }, [now]);

  const isPrayerPassed = useCallback((prayerTime: string | Date | undefined): boolean => {
    const date = toDate(prayerTime);
    if (!date) return false;

    const prayerTotal = date.getHours() * 60 + date.getMinutes();
    const currentTotal = now.getHours() * 60 + now.getMinutes();

    return prayerTotal < currentTotal;
  }, [now]);

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
  }, [prayers, isPrayerPassed]); // Заменил now на isPrayerPassed

  const handlePrayerClick = useCallback((prayer: Prayers) => {
    setSelectedPrayer(prayer);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPrayer(null);
  }, []);

  // Функции для сенсоров и навигации
  const resetSensorPermission = useCallback(() => {
    setSensorPermission("prompt");
    setOrientationListenerActive(false);
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    localStorage.removeItem("userHeading");
    alert(t("permissionResetSuccess"));
  }, []);

  const requestSensorPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (result === "granted") {
          setSensorPermission("granted");
        } else {
          setSensorPermission("denied");
        }
      } else {
        window.addEventListener("deviceorientation", () => {}, { once: true });
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const handleCompassClick = useCallback(async (currentPermission: string) => {
    if (currentPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (currentPermission === "prompt") {
      setIsRequestingPermission(true);
      try {
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          (DeviceOrientationEvent as any).requestPermission
        ) {
          const result = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          
          if (result === "granted") {
            setSensorPermission("granted");
            navigate("/qibla", { state: { activeTab: "compass" } });
          } else {
            setSensorPermission("denied");
            alert(t("sensorPermissionRequired"));
          }
        } else {
          setSensorPermission("granted");
          navigate("/qibla", { state: { activeTab: "compass" } });
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        setSensorPermission("denied");
        alert(t("sensorPermissionError"));
      } finally {
        setIsRequestingPermission(false);
      }
    } else if (currentPermission === "granted") {
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    // Prayer times logic
    isModalOpen,
    selectedPrayer,
    now,
    sortedPrayers,
    handlePrayerClick,
    handleCloseModal,
    formatTime,
    getMinutesUntilPrayer,
    isPrayerPassed,
    
    // Home logic
    sensorPermission,
    isRequestingPermission,
    isInitializing,
    languageReady,
    initializationError,
    orientationListenerActive,
    requestSensorPermission,
    resetSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};