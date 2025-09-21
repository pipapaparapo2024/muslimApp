import { t } from "i18next";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Language } from "../../hooks/useLanguages";
import { quranApi } from "../../api/api";
import i18n from "../../api/i18n";
import { applyLanguageStyles } from "../../hooks/useLanguages";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

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

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  // Функция обработки данных компаса
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const iosEvent = event as unknown as DeviceOrientationEventiOS;
    const hasStandardCompass = event.alpha !== null;
    const hasWebKitCompass = iosEvent.webkitCompassHeading !== undefined;

    if (!hasStandardCompass && !hasWebKitCompass) return;

    let newHeading: number;
    if (hasWebKitCompass) {
      newHeading = iosEvent.webkitCompassHeading!;
    } else {
      newHeading = (event.alpha! + 360) % 360;
    }

    localStorage.setItem("userHeading", newHeading.toString());
  }, []);

  // ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        
        const userLanguage = await fetchLanguageFromBackend();
        if (userLanguage) {
          await i18n.changeLanguage(userLanguage);
          applyLanguageStyles(userLanguage);
          localStorage.setItem("preferred-language", userLanguage);
        }

        localStorage.setItem("appInitialized", "true");
      } catch (error) {
        console.error("Initialization error:", error);
        setInitializationError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Синхронизируем состояние с localStorage
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // ФУНКЦИЯ СБРОСА РАЗРЕШЕНИЯ
  const resetSensorPermission = useCallback(() => {
    setSensorPermission("prompt");
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    localStorage.removeItem("userHeading");
    // Удаляем слушатель при сбросе
    window.removeEventListener("deviceorientation", handleOrientation as EventListener);
    alert(t("permissionResetSuccess"));
  }, [handleOrientation]);

  // ЗАПРОС ДОСТУПА К ДАТЧИКАМ
  const requestSensorPermission = useCallback(async (): Promise<string> => {
    setIsRequestingPermission(true);
    try {
      // Проверяем поддержку API запроса разрешения (iOS 13+)
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        console.log("Requesting sensor permission on iOS...");
        
        const result = await (DeviceOrientationEvent as any).requestPermission();
        console.log("iOS Permission result:", result);
        
        setSensorPermission(result);
        
        // Если разрешение получено, добавляем слушатель
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation as EventListener);
        }
        
        return result;
      } 
      // Для Android и других браузеров
      else if (typeof DeviceOrientationEvent !== "undefined") {
        console.log("No permission API, assuming granted for non-iOS");
        
        // Пробуем добавить слушатель - если сработает, значит разрешение есть
        const testListener = () => {
          console.log("Device orientation supported without permission request");
        };
        
        window.addEventListener("deviceorientation", testListener as EventListener, { once: true });
        setTimeout(() => {
          window.removeEventListener("deviceorientation", testListener as EventListener);
        }, 100);
        
        setSensorPermission("granted");
        window.addEventListener("deviceorientation", handleOrientation as EventListener);
        return "granted";
      } 
      // Браузер не поддерживает DeviceOrientation
      else {
        console.log("DeviceOrientation not supported");
        setSensorPermission("unsupported");
        return "unsupported";
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
      return "denied";
    } finally {
      setIsRequestingPermission(false);
    }
  }, [handleOrientation]);

  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt") {
      const result = await requestSensorPermission();
      if (result === "granted") {
        navigate("/qibla", { state: { activeTab: "compass" } });
      }
    } else if (sensorPermission === "granted") {
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, requestSensorPermission, navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission,
    isInitializing,
    initializationError,
    requestSensorPermission,
    resetSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};