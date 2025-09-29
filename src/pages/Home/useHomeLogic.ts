import { t } from "i18next";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Language } from "../../hooks/useLanguages";
import { quranApi } from "../../api/api";
import i18n from "../../api/i18n";
import { applyLanguageStyles } from "../../hooks/useLanguages";
import { trackButtonClick } from "../../api/analytics";
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const VPN_WARNING_SHOWN = "vpnWarningShown";

export const fetchLanguageFromBackend = async (): Promise<Language | null> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const response = await quranApi.get("api/v1/settings/languages/selected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const backendLanguage = response.data.data.language.name;
    return backendLanguage;
  } catch (error) {
    console.error("Error fetching language:", error);
    return null;
  }
};

export const useHomeLogic = () => {
  const navigate = useNavigate();
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
    const initializeLanguage = async () => {
      try {
        const userLanguage = await fetchLanguageFromBackend();

        if (userLanguage) {
          await i18n.changeLanguage(userLanguage);
          applyLanguageStyles(userLanguage);
          localStorage.setItem("preferred-language", userLanguage);
        }

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

    initializeLanguage();
  }, []);

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
    alert("VPN warning has been reset. It will show again on next page load.");
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
          trackButtonClick("sensor_permission_granted");
        } else {
          setSensorPermission("denied");
          trackButtonClick("sensor_permission_denied");
        }
      } else {
        window.addEventListener("deviceorientation", () => {}, { once: true });
        setSensorPermission("granted");
        trackButtonClick("sensor_permission_auto_granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
      trackButtonClick('sensor_permission_error', { error: err });
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const handleCompassClick = useCallback(
    async (currentPermission: string) => {
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
    },
    [navigate]
  );

  const handleMapClick = useCallback(() => {
    trackButtonClick('map_navigation');
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
    handleResetVpnWarning, // Добавлена в возвращаемый объект
    requestSensorPermission,
    resetSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};
