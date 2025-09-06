// hooks/useHomeLogic.ts
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useGeoStore } from "../../hooks/useGeoStore";

// Ключи для localStorage
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();
  const { settingsSent, sendUserSettings } = useUserParametersStore();

  // Получаем данные из геостора
  const {
    ipData,
    isLoading: isGeoLoading,
    error: geoError,
    fetchFromIpApi,
    reset: resetGeoStore,
    getLocationData,
  } = useGeoStore();

  // Получаем актуальные данные местоположения
  const locationData = getLocationData();
  const { coords, city, country, timeZone } = locationData;

  // Состояние доступа к датчикам
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved === "granted" ? "granted" : "prompt";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const settingsSentRef = useRef(settingsSent);

  // Обновляем ref при изменении settingsSent
  useEffect(() => {
    settingsSentRef.current = settingsSent;
  }, [settingsSent]);

  // === ОТПРАВКА НАСТРОЕК МЕСТОПОЛОЖЕНИЯ ===
  const sendLocationSettings = async () => {
    if (
      city &&
      country &&
      timeZone &&
      city !== "Unknown" &&
      country !== "Unknown"
    ) {
      console.log("Отправляем настройки местоположения:", {
        city,
        countryCode: ipData?.country.code || null,
        langcode: ipData?.langcode || null,
        timeZone,
      });

      try {
        await sendUserSettings({
          city,
          countryCode: ipData?.country.code || null,
          langcode: ipData?.langcode || null,
          timeZone,
        });
        console.log("Настройки успешно отправлены");
      } catch (error) {
        console.error("Ошибка при отправке настроек:", error);
      }
    }
  };

  useEffect(() => {
    sendLocationSettings();
  }, [city, country, timeZone, sendUserSettings]);

  // === ОБНОВЛЕНИЕ ГЕОЛОКАЦИИ ===
  const handleRefreshLocationData = async () => {
    setIsRefreshing(true);

    // Сбрасываем кэш и данные
    localStorage.removeItem("ipDataCache");
    resetGeoStore();

    try {
      await fetchFromIpApi();
    } catch (error) {
      console.error("Failed to refresh location data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
  }, []);

  // === ЗАПРОС ДОСТУПА К ДАТЧИКАМ ===
  const requestSensorPermission = async () => {
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
  };

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
  const handleCompassClick = () => {
    navigate("/qibla", { state: { activeTab: "compass" } });
  };

  const handleMapClick = () =>
    navigate("/qibla", { state: { activeTab: "map" } });

  return {
    // Состояния
    sensorPermission,
    isRefreshing,
    coords,
    city,
    country,
    timeZone,
    isLoading: isGeoLoading,
    error: geoError,

    // Обработчики
    requestSensorPermission,
    handleRefreshLocationData,
    handleCompassClick,
    handleMapClick,
  };
};