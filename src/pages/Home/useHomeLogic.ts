// hooks/useHomeLogic.ts
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useGeoStore } from "../../hooks/useGeoStore";

// Ключи для localStorage
const GEO_PERMISSION_STATUS = "geoPermissionStatus";
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const CACHED_LOCATION = "cachedLocation";
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
    setCoords,
    setCity,
    setCountry,
    setTimeZone,
    setError,
    setHasRequestedGeo,
  } = useGeoStore();

  // Состояние доступа к датчикам
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    return saved === "granted" ? "granted" : "prompt";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const geoRequested = useRef(false);
  const ipDataFetched = useRef(false);
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
    }
  };

  useEffect(() => {
    sendLocationSettings();
  }, [city, country, timeZone, sendUserSettings]);

  // === ОБНОВЛЕНИЕ ГЕОЛОКАЦИИ ===
  const handleRefreshLocationData = async () => {
    setIsRefreshing(true);

    localStorage.removeItem(IP_DATA_CACHE);
    localStorage.removeItem(CACHED_LOCATION);

    setCoords(null);
    setCity(null);
    setCountry(null);
    setTimeZone(null);
    setError(null);

    ipDataFetched.current = false;
    geoRequested.current = false;

    try {
      await fetchFromIpApi();
      ipDataFetched.current = true;

      const geoStatus = localStorage.getItem(GEO_PERMISSION_STATUS);
      if (geoStatus === "granted") {
        await requestGeolocation();
      }
    } catch (error) {
      console.error("Failed to refresh location data:", error);
      setError("Не удалось обновить данные местоположения");
    } finally {
      setIsRefreshing(false);
    }
  };

  // === ГЕОЛОКАЦИЯ ===
  const requestGeolocation = async () => {
    geoRequested.current = true;
    setHasRequestedGeo(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        const locationData = { lat, lon, timestamp: Date.now() };

        localStorage.setItem(CACHED_LOCATION, JSON.stringify(locationData));
        localStorage.setItem(GEO_PERMISSION_STATUS, "granted");
        setCoords({ lat, lon });

        const cachedIpData = getCachedIpData();
        if (cachedIpData) {
          setCity(cachedIpData.city || "Unknown");
          setCountry(cachedIpData.country || "Unknown");
          setTimeZone(cachedIpData.timeZone || null);
        } else if (!ipDataFetched.current) {
          fetchFromIpApi()
            .then(() => (ipDataFetched.current = true))
            .catch(() => {
              setCity("Unknown");
              setCountry("Unknown");
              setTimeZone(null);
            });
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        localStorage.setItem(GEO_PERMISSION_STATUS, "denied");

        const cachedIpData = getCachedIpData();
        if (cachedIpData) {
          setCoords(cachedIpData.coords);
          setCity(cachedIpData.city || "Unknown");
          setCountry(cachedIpData.country || "Unknown");
          setTimeZone(cachedIpData.timeZone || null);
        } else if (!ipDataFetched.current) {
          fetchFromIpApi()
            .then(() => (ipDataFetched.current = true))
            .catch(() => {
              setError("Не удалось определить местоположение");
            });
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // === КЭШ IP ===
  const getCachedIpData = () => {
    try {
      const cached = localStorage.getItem(IP_DATA_CACHE);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 2 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached IP data", e);
    }
    return null;
  };

  // === ИНИЦИАЛИЗАЦИЯ ГЕОДАННЫХ ===
  useEffect(() => {
    if (geoRequested.current) return;

    const initializeLocation = async () => {
      geoRequested.current = true;

      const status = localStorage.getItem(GEO_PERMISSION_STATUS);
      const cached = localStorage.getItem(CACHED_LOCATION);

      if (cached) {
        try {
          const data = JSON.parse(cached);
          const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
          if (isFresh && data.lat && data.lon) {
            setCoords({ lat: data.lat, lon: data.lon });

            if (!ipDataFetched.current) {
              try {
                await fetchFromIpApi();
                ipDataFetched.current = true;
              } catch (_) {
                setCity("Unknown");
                setCountry("Unknown");
                setTimeZone(null);
              }
            }
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached location", e);
        }
      }

      if (!status || status === "unknown") {
        await requestGeolocation();
      } else if (status === "granted") {
        await requestGeolocation();
      } else if (status === "denied") {
        if (!ipDataFetched.current) {
          try {
            await fetchFromIpApi();
            ipDataFetched.current = true;
          } catch (_) {
            setError("Не удалось определить местоположение");
          }
        }
      }
    };

    initializeLocation();
  }, [settingsSent]);

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
    isLoading,
    error,

    // Обработчики
    requestSensorPermission,
    handleRefreshLocationData,
    handleCompassClick,
    handleMapClick,
  };
};
