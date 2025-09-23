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
  const [isInitializing, setIsInitializing] = useState(true); // Начинаем с true
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );
  const [orientationListenerActive, setOrientationListenerActive] =
    useState(false);
  const [languageReady, setLanguageReady] = useState(false); // Новое состояние для языка

  // Инициализируем состояние из localStorage
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved || "prompt";
  });

  // ИНИЦИАЛИЗАЦИЯ ЯЗЫКА - выполняется первой
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Получаем и устанавливаем язык с бекенда
        const userLanguage = await fetchLanguageFromBackend();
        console.log("selectedlang", userLanguage);

        if (userLanguage) {
          await i18n.changeLanguage(userLanguage);
          applyLanguageStyles(userLanguage);
          localStorage.setItem("preferred-language", userLanguage);
        }

        // Помечаем, что язык готов
        setLanguageReady(true);
      } catch (error) {
        console.error("Language initialization error:", error);
        setInitializationError(
          error instanceof Error
            ? error.message
            : "Language initialization error"
        );
        setLanguageReady(true); // Все равно продолжаем, даже с ошибкой
      } finally {
        setIsInitializing(false);
      }
    };

    initializeLanguage();
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
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    sensorPermission,
    isRequestingPermission,
    isInitializing,
    languageReady, // Экспортируем состояние готовности языка
    initializationError,
    orientationListenerActive,
    requestSensorPermission,
    resetSensorPermission,
    handleCompassClick,
    handleMapClick,
  };
};
