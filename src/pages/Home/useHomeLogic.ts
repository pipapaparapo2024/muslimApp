import { t } from "i18next";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Language } from "../../hooks/useLanguages";
import { quranApi } from "../../api/api";
import i18n from "../../api/i18n";
import { applyLanguageStyles } from "../../hooks/useLanguages";

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

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Инициализируем состояние из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  // ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        
        // Получаем и устанавливаем язык с бекенда
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

  // Синхронизируем состояние с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(SENSOR_PERMISSION_STATUS, sensorPermission);
  }, [sensorPermission]);

  // ФУНКЦИЯ СБРОСА РАЗРЕШЕНИЯ
  const resetSensorPermission = useCallback(() => {
    setSensorPermission("prompt");
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    localStorage.removeItem("userHeading");
    alert(t("permissionResetSuccess"));
  }, []);

  // ЗАПРОС ДОСТУПА К ДАТЧИКАМ
  const requestSensorPermission = useCallback(async (): Promise<string> => {
    setIsRequestingPermission(true);
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result); // "granted" или "denied"
        return result;
      } else {
        // Для браузеров без API запроса разрешения
        window.addEventListener("deviceorientation", () => {}, { once: true });
        setSensorPermission("granted");
        return "granted";
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
      return "denied";
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt") {
      const result = await requestSensorPermission();
      // После запроса разрешения, если оно granted, переходим
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