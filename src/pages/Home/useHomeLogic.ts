import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trackButtonClick } from "../../api/analytics";
import { getPlatform } from "./QiblaCompass/QiblaCompass";
import { useGeoStore } from "../../hooks/useGeoStore";
import { useTranslationsStore } from "../../hooks/useTranslations";
import { useLanguage } from "../../hooks/useLanguages";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const VPN_WARNING_SHOWN = "vpnWarningShown";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const { country, langcode } = useGeoStore();
  const { translations } = useTranslationsStore();
  const { language } = useLanguage();

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [orientationListenerActive, setOrientationListenerActive] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);
  const [showVpnWarning, setShowVpnWarning] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    return localStorage.getItem(SENSOR_PERMISSION_STATUS) || "prompt";
  });

  // 🔹 Выполняется один раз при запуске приложения
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const device = getPlatform();
        const tgUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;
        const hasTelegramPremium = tgUser?.is_premium === true;
        const sessionStarted = localStorage.getItem("sessionStarted");

        // trackButtonClick вызывается ТОЛЬКО один раз за сессию
        if (!sessionStarted) {
          trackButtonClick("user", "session_start", {
            device,
            country,
            langcode,
            hasTelegramPremium,
          });
          localStorage.setItem("sessionStarted", "true");
        }

        const vpnWarningShown = localStorage.getItem(VPN_WARNING_SHOWN);
        if (!vpnWarningShown) setShowVpnWarning(true);

        setLanguageReady(true);
      } catch (error) {
        console.error("Initialization error:", error);
        setInitializationError(
          error instanceof Error ? error.message : "Initialization error"
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [country, langcode]);

  // 🔹 Сохраняем разрешения на сенсор
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // ----- VPN Warning -----
  const handleCloseVpnWarning = useCallback(() => {
    setShowVpnWarning(false);
    localStorage.setItem(VPN_WARNING_SHOWN, "true");
  }, []);

  const handleOpenVpnWarning = useCallback(() => {
    setShowVpnWarning(true);
  }, []);

  const handleResetVpnWarning = useCallback(() => {
    localStorage.removeItem(VPN_WARNING_SHOWN);
    setShowVpnWarning(true);
    alert("VPN warning has been reset. It will show again on next page load.");
  }, []);

  // ----- Sensor permissions -----
  const resetSensorPermission = useCallback(() => {
    setSensorPermission("prompt");
    setOrientationListenerActive(false);
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    localStorage.removeItem("userHeading");
    alert(translations?.permissionResetSuccess);
  }, [translations]);

  const requestSensorPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result === "granted" ? "granted" : "denied");
      } else {
        // Desktop fallback
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
        alert(translations?.sensorPermissionDeniedMessage);
        return;
      }

      if (currentPermission === "prompt") {
        await requestSensorPermission();
        if (sensorPermission === "granted") {
          navigate("/qibla", { state: { activeTab: "compass" } });
        }
      } else {
        navigate("/qibla", { state: { activeTab: "compass" } });
      }
    },
    [navigate, translations, requestSensorPermission, sensorPermission]
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
    language, 
  };
};
