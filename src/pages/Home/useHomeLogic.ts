import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useGeoStore } from "../../hooks/useGeoStore";

// Ключи для localStorage
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const IP_DATA_CACHE = "ipDataCache";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const { settingsSent, sendUserSettings } = useUserParametersStore();

  // Геоданные из стора
  const {
    langcode,
    coords,
    city,
    country,
    timeZone,
    isLoading,
    error,
    fetchFromIpApi,
    setError,
    setLoading,
  } = useGeoStore();

  // Состояние доступа к датчикам
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved === "granted" ? "granted" : "prompt";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ipDataFetched = useRef(false);
  const settingsSentRef = useRef(settingsSent);

  // Обновляем ref при изменении settingsSent
  useEffect(() => {
    settingsSentRef.current = settingsSent;
  }, [settingsSent]);

  // === ОТПРАВКА НАСТРОЕК МЕСТОПОЛОЖЕНИЯ ===
  const sendLocationSettings = useCallback(async () => {
    if (!city || !country || !timeZone) {
      console.log("Не все данные доступны для отправки");
      return;
    }
    console.log("Отправляем настройки местоположения:", {
      city,
      country,
      langcode,
      timeZone,
    });
    try {
      await sendUserSettings({
        city,
        countryName: country,
        langcode,
        timeZone,
      });
      console.log("Настройки успешно отправлены");
    } catch (error) {
      console.error("Ошибка при отправке настроек:", error);
    }
  }, [city, country, timeZone, langcode, sendUserSettings]);

  useEffect(() => {
    sendLocationSettings();
  }, [city,country,timeZone]);

  // === ОБНОВЛЕНИЕ ГЕОЛОКАЦИИ ===
  const handleRefreshLocationData = useCallback(async () => {
    setIsRefreshing(true);
    setLoading(true);

    // Очищаем кэш ПЕРЕД запросом
    localStorage.removeItem(IP_DATA_CACHE);
    ipDataFetched.current = false;

    try {
      await fetchFromIpApi();
      ipDataFetched.current = true;
    } catch (error) {
      console.error("Failed to refresh location data:", error);
      setError("Не удалось обновить данные местоположения");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [fetchFromIpApi, setError, setLoading]);

  // === ИНИЦИАЛИЗАЦИЯ ГЕОДАННЫХ ===
  useEffect(() => {
    const initializeLocation = async () => {
      // Всегда делаем свежий запрос при инициализации
      if (!ipDataFetched.current) {
        try {
          await fetchFromIpApi();
          ipDataFetched.current = true;
        } catch (_) {
          setError("Не удалось определить местоположение");
        }
      }
    };

    initializeLocation();
  }, [fetchFromIpApi, setError]);

  // === ПРОВЕРКА ДОСТУПА К ДАТЧИКАМ ПРИ ЗАГРУЗКЕ ===
  useEffect(() => {
    let isMounted = true;

    const checkSensorAccess = () => {
      if (sensorPermission === "granted") return;

      const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);

      if (saved === "granted") {
        const handler = (event: DeviceOrientationEvent) => {
          if (
            isMounted &&
            (event.alpha !== null ||
              event.beta !== null ||
              event.gamma !== null)
          ) {
            window.removeEventListener("deviceorientation", handler);
            setSensorPermission("granted");
          }
        };

        window.addEventListener("deviceorientation", handler, { once: true });

        const timeout = setTimeout(() => {
          window.removeEventListener("deviceorientation", handler);
          if (isMounted) {
            setSensorPermission("prompt");
          }
        }, 1000);

        return () => clearTimeout(timeout);
      } else {
        if (isMounted) {
          setSensorPermission("prompt");
        }
      }
    };

    checkSensorAccess();

    return () => {
      isMounted = false;
    };
  }, [sensorPermission]);

  // === ЗАПРОС ДОСТУПА К ДАТЧИКАМ ===
  const requestSensorPermission = useCallback(async () => {
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (result === "granted") {
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
          setSensorPermission("granted");
        } else {
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
          setSensorPermission("denied");
        }
      } else {
        window.addEventListener("deviceorientation", () => {}, { once: true });
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
      setSensorPermission("denied");
    }
  }, []);

  // Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.MainButton.hide();
      tg.BackButton.hide();
      tg.enableClosingConfirmation();
    }
  }, []);

  // Навигация
  const handleCompassClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "compass" } });
  }, [navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return {
    // Состояния
    sensorPermission,
    isRefreshing,
    coords,
    city,
    country,
    timeZone,
    isLoading,
    error,

    // Обработчики
    requestSensorPermission,
    handleRefreshLocationData,
    handleCompassClick,
    handleMapClick,
  };
};
