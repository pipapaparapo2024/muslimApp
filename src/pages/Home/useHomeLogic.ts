import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Language } from "../../hooks/useLanguages";
import { quranApi } from "../../api/api";
import { applyLanguageStyles } from "../../hooks/useLanguages";
import { trackButtonClick } from "../../api/analytics";
import { useTranslationsStore } from "../../hooks/useTranslations";
import { getPlatform } from "./QiblaCompass/QiblaCompass";
import { useGeoStore } from "../../hooks/useGeoStore";
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const VPN_WARNING_SHOWN = "vpnWarningShown";
const TRANSLATIONS_LOADED = "translationsLoaded"; // Флаг загрузки переводов

export const fetchLanguageFromBackend = async (): Promise<Language | null> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const response = await quranApi.get("api/v1/settings/languages/selected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const backendLanguage = response.data.data.language.languageCode;
    console.log("backendLanguage", backendLanguage);
    return backendLanguage;
  } catch (error) {
    console.error("Error fetching language:", error);
    return null;
  }
};

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const { country, langcode } = useGeoStore();
  const { loadTranslations, translations } = useTranslationsStore();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );
  const [orientationListenerActive, setOrientationListenerActive] =
    useState(false);
  const [languageReady, setLanguageReady] = useState(false);

  const [showVpnWarning, setShowVpnWarning] = useState(false);

  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const device = getPlatform();
        const tgUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;
        const hasTelegramPremium = tgUser?.is_premium === true;
        const sessionStarted = localStorage.getItem("sessionStarted");

        if (!sessionStarted) {
          trackButtonClick("user", "session_start", {
            device,
            country,
            langcode,
            hasTelegramPremium,
          });
          localStorage.setItem("sessionStarted", "true");
        }

        // 1. Получаем язык пользователя
        const userLanguage = await fetchLanguageFromBackend();
        if (userLanguage) {
          applyLanguageStyles(userLanguage);
          localStorage.setItem("preferred-language", userLanguage);

          // 2. Загружаем переводы только если они еще не загружены
          const translationsLoaded = localStorage.getItem(TRANSLATIONS_LOADED);
          if (!translationsLoaded || translationsLoaded !== userLanguage) {
            console.log("🚀 Загружаем переводы при инициализации приложения");
            await loadTranslations(userLanguage);
            localStorage.setItem(TRANSLATIONS_LOADED, userLanguage);
          } else {
            console.log("✅ Переводы уже загружены для языка:", userLanguage);
          }
        }

        // 3. Показываем VPN предупреждение если нужно
        const vpnWarningShown = localStorage.getItem(VPN_WARNING_SHOWN);
        if (!vpnWarningShown) {
          setShowVpnWarning(true);
        }

        setLanguageReady(true);
      } catch (error) {
        console.error("Language initialization error:", error);
        setInitializationError(
          error instanceof Error
            ? error.message
            : "Language initialization error"
        );
        setLanguageReady(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [loadTranslations, country, langcode]);

  // Функция для скрытия предупреждения о VPN
  const handleCloseVpnWarning = useCallback(() => {
    setShowVpnWarning(false);
    localStorage.setItem(VPN_WARNING_SHOWN, "true");
  }, []);

  // Функция для открытия предупреждения о VPN
  const handleOpenVpnWarning = useCallback(() => {
    setShowVpnWarning(true);
  }, []);

  // Функция для сброса предупреждения о VPN (новая функция)
  const handleResetVpnWarning = useCallback(() => {
    localStorage.removeItem(VPN_WARNING_SHOWN);
    setShowVpnWarning(true);
    alert(translations?.vpnWarningReset);
  }, []);

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  const resetSensorPermission = useCallback(() => {
    setSensorPermission("prompt");
    setOrientationListenerActive(false);
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    localStorage.removeItem("userHeading");
    // Используем хардкод или получаем перевод из хранилища
    alert(translations?.permissionReset);
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

  const handleCompassClick = useCallback(
    async (currentPermission: string) => {
      if (currentPermission === "denied") {
        alert(translations?.sensorPermissionDenied);
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
              alert(translations?.sensorPermissionRequired);
            }
          } else {
            setSensorPermission("granted");
            navigate("/qibla", { state: { activeTab: "compass" } });
          }
        } catch (err) {
          console.error("Sensor permission error:", err);
          setSensorPermission("denied");
          alert(translations?.errorRequestingSensor);
        } finally {
          setIsRequestingPermission(false);
        }
      } else if (currentPermission === "granted") {
        navigate("/qibla", { state: { activeTab: "compass" } });
      }
    },
    [navigate]
  );

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission,
    isInitializing,
    languageReady,
    initializationError,
    orientationListenerActive,
    showVpnWarning,
    handleCloseVpnWarning,
    handleOpenVpnWarning,
    handleResetVpnWarning,
    requestSensorPermission,
    resetSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};
