import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGeoStore } from "../../hooks/useGeoStore";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";

// Ключи для localStorage
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

export const useHomeLogic = () => {
  const navigate = useNavigate();

  // Геоданные из стора
  const {
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

  const { sendUserSettings } = useUserParametersStore();

  // Состояние доступа к датчикам
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved === "granted" ? "granted" : "prompt";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs для отслеживания состояния
  const ipDataFetched = useRef(false);
  const geoRequestSent = useRef(false);

  // Функция обновления геоданных и отправки настроек
  const handleRefreshLocationData = useCallback(async () => {
    setIsRefreshing(true);
    setLoading(true);

    try {
      // Обновляем геоданные
      await fetchFromIpApi();

      // Отправляем обновленные настройки
      if (city && country && timeZone) {
        await sendUserSettings({
          city,
          countryName: country,
          langcode: null,
          timeZone,
        });
      }
    } catch (error) {
      console.error("Failed to refresh location data:", error);
      setError("Не удалось обновить данные местоположения");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [
    fetchFromIpApi,
    setError,
    setLoading,
    sendUserSettings,
    city,
    country,
    timeZone,
  ]);

  // === ИНИЦИАЛИЗАЦИЯ ГЕОДАННЫХ ===
  useEffect(() => {
    const initializeLocation = async () => {
      // Всегда делаем свежий запрос при инициализации
      if (!ipDataFetched.current && !geoRequestSent.current) {
        geoRequestSent.current = true; // ← Помечаем как отправленный
        try {
          await fetchFromIpApi();
          ipDataFetched.current = true;
        } catch (_) {
          setError("Не удалось определить местоположение");
          geoRequestSent.current = false; // ← Разрешаем повторную попытку
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