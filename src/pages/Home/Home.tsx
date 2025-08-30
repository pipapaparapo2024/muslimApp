// Home.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { QiblaMap } from "./QiblaCompass/QiblaMap";
import { Header } from "../../components/header/Header";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useGeoStore } from "../../hooks/useGeoStore";

// Ключи для localStorage
const GEO_PERMISSION_STATUS = "geoPermissionStatus";
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const CACHED_LOCATION = "cachedLocation";
const IP_DATA_CACHE = "ipDataCache";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { settingsSent, sendUserSettings } = useUserParametersStore();

  // Используем стор для геоданных
  const {
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

  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [showSensorPrompt, setShowSensorPrompt] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "unknown"
  );

  const geoRequested = useRef(false);
  const sensorRequested = useRef(false);
  const ipDataFetched = useRef(false);

  // Функция для получения данных из кэша
  const getCachedIpData = () => {
    try {
      const cached = localStorage.getItem(IP_DATA_CACHE);
      if (cached) {
        const data = JSON.parse(cached);
        // Проверяем что кэш свежий (менее 24 часов)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached IP data", e);
    }
    return null;
  };

  // Функция для запроса геолокации
  const requestGeolocation = async () => {
    geoRequested.current = true;
    setShowGeoPrompt(false);
    setHasRequestedGeo(true);

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          const locationData = { lat, lon, timestamp: Date.now() };

          localStorage.setItem(CACHED_LOCATION, JSON.stringify(locationData));
          localStorage.setItem(GEO_PERMISSION_STATUS, "granted");

          // Сохраняем координаты в стор
          setCoords({ lat, lon });

          // Используем кэшированные данные IP если они есть
          const cachedIpData = getCachedIpData();
          if (cachedIpData) {
            setCity(cachedIpData.city || "Unknown");
            setCountry(cachedIpData.country || "Unknown");
            setTimeZone(cachedIpData.timeZone || null);
          } else if (!ipDataFetched.current) {
            try {
              await fetchFromIpApi();
              ipDataFetched.current = true;
            } catch (error) {
              console.warn("IP API failed, using coordinates only");
              setCity("Unknown");
              setCountry("Unknown");
              setTimeZone(null);
            }
          }

          // Отправляем данные в хранилище пользователя
          if (!settingsSent) {
            sendUserSettings({
              city: city || "Unknown",
              country: country || "Unknown",
              timeZone: timeZone,
            });
          }

          resolve();
        },
        async (error) => {
          console.warn("Geolocation error:", error);
          localStorage.setItem(GEO_PERMISSION_STATUS, "denied");

          // Используем кэшированные данные IP если они есть
          const cachedIpData = getCachedIpData();
          if (cachedIpData) {
            setCoords(cachedIpData.coords);
            setCity(cachedIpData.city || "Unknown");
            setCountry(cachedIpData.country || "Unknown");
            setTimeZone(cachedIpData.timeZone || null);
          } else if (!ipDataFetched.current) {
            try {
              await fetchFromIpApi();
              ipDataFetched.current = true;
            } catch (ipError) {
              setError("Не удалось определить местоположение");
              setCity("Unknown");
              setCountry("Unknown");
              setTimeZone(null);
            }
          }

          // Отправляем данные в хранилище
          if (!settingsSent) {
            sendUserSettings({
              city: city || "Unknown",
              country: country || "Unknown",
              timeZone: timeZone,
            });
          }

          resolve();
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  // Функция для запроса доступа к датчикам
  const requestSensorPermission = async () => {
    sensorRequested.current = true;
    setShowSensorPrompt(false);

    try {
      const DeviceOrientationEventAny = DeviceOrientationEvent as any;
      if (DeviceOrientationEventAny?.requestPermission) {
        // iOS
        const result = await DeviceOrientationEventAny.requestPermission();
        localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        setSensorPermission(result);
      } else {
        // Android и другие
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
      setSensorPermission("denied");
    }
  };

  // Проверка геолокации при монтировании
  useEffect(() => {
    if (geoRequested.current) return;

    const initializeLocation = async () => {
      // Сначала проверяем кэшированные данные IP
      const cachedIpData = getCachedIpData();
      if (cachedIpData) {
        setCoords(cachedIpData.coords);
        setCity(cachedIpData.city || "Unknown");
        setCountry(cachedIpData.country || "Unknown");
        setTimeZone(cachedIpData.timeZone || null);
        
        // Отправляем данные в хранилище
        if (!settingsSent) {
          sendUserSettings({
            city: cachedIpData.city || "Unknown",
            country: cachedIpData.country || "Unknown",
            timeZone: cachedIpData.timeZone,
          });
        }
        return;
      }

      const status = localStorage.getItem(GEO_PERMISSION_STATUS);
      const cached = localStorage.getItem(CACHED_LOCATION);

      // Если есть кэш геолокации и он свежий, используем
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
          if (isFresh && data.lat && data.lon) {
            setCoords({ lat: data.lat, lon: data.lon });
            
            // Получаем данные по IP для города/страны
            if (!ipDataFetched.current) {
              try {
                await fetchFromIpApi();
                ipDataFetched.current = true;
              } catch (error) {
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

      // Если разрешение уже отклонено - используем только IP данные
      if (status === "denied") {
        if (!ipDataFetched.current) {
          try {
            await fetchFromIpApi();
            ipDataFetched.current = true;
          } catch (error) {
            setError("Не удалось определить местоположение");
          }
        }
        return;
      }

      // Если разрешение уже предоставлено
      if (status === "granted") {
        requestGeolocation();
        return;
      }

      // Для iOS показываем промпт вместо автоматического запроса
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && (!status || status === "unknown")) {
        setShowGeoPrompt(true);
        return;
      }

      // Для Android и других - запрашиваем сразу
      if (!status || status === "unknown") {
        requestGeolocation();
      }
    };

    initializeLocation();
  }, [settingsSent, sendUserSettings, fetchFromIpApi, setCoords, setCity, setCountry, setTimeZone, setError, setHasRequestedGeo]);

  // Проверка доступа к датчикам
  useEffect(() => {
    if (sensorRequested.current) return;

    const status = localStorage.getItem(SENSOR_PERMISSION_STATUS);

    if (status === "granted" || status === "denied") {
      setSensorPermission(status);
      return;
    }

    // Для iOS показываем промпт вместо автоматического запроса
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const DeviceOrientationEventAny = DeviceOrientationEvent as any;

    if (isIOS && DeviceOrientationEventAny?.requestPermission) {
      setShowSensorPrompt(true);
    } else {
      // Для Android запрашиваем автоматически
      requestSensorPermission();
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

  const handleCompassClick = () => {
    // Для iOS запрашиваем разрешение при клике на компас
    if (sensorPermission !== "granted") {
      requestSensorPermission();
    }
    navigate("/qibla", { state: { activeTab: "compass" } });
  };

  const handleMapClick = () =>
    navigate("/qibla", { state: { activeTab: "map" } });

  return (
    <PageWrapper>
      <Header
        city={city || "Unknown city"}
        country={country || "Unknown country"}
      />
      <div className={styles.homeRoot}>
        {/* Промпт для геолокации iOS */}
        {showGeoPrompt && (
          <div className={styles.permissionPrompt}>
            <h3>Разрешить доступ к геолокации?</h3>
            <p>
              Для точного определения киблы нужен доступ к вашему местоположению
            </p>
            <div className={styles.permissionButtons}>
              <button onClick={requestGeolocation}>Разрешить</button>
              <button
                onClick={() => {
                  setShowGeoPrompt(false);
                  localStorage.setItem(GEO_PERMISSION_STATUS, "denied");
                  // Используем кэшированные данные IP
                  const cachedIpData = getCachedIpData();
                  if (cachedIpData) {
                    setCoords(cachedIpData.coords);
                    setCity(cachedIpData.city || "Unknown");
                    setCountry(cachedIpData.country || "Unknown");
                    setTimeZone(cachedIpData.timeZone || null);
                  } else if (!ipDataFetched.current) {
                    fetchFromIpApi().then(() => {
                      ipDataFetched.current = true;
                    });
                  }
                }}
              >
                Отказать
              </button>
            </div>
          </div>
        )}

        {/* Промпт для датчиков iOS */}
        {showSensorPrompt && (
          <div className={styles.permissionPrompt}>
            <h3>Разрешить доступ к датчикам движения?</h3>
            <p>Для работы компаса нужен доступ к гироскопу и акселерометру</p>
            <div className={styles.permissionButtons}>
              <button onClick={requestSensorPermission}>Разрешить</button>
              <button
                onClick={() => {
                  setShowSensorPrompt(false);
                  localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
                  setSensorPermission("denied");
                }}
              >
                Отказать
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            Определяем ваше местоположение...
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", textAlign: "center", color: "red" }}>
            {error}
          </div>
        )}

        {/* Показываем контент когда есть данные (город или координаты) */}
        {!isLoading && (city || coords) && (
          <div className={styles.prayerTimesQiblaContainer}>
            <PrayerTimes />
            <div className={styles.qiblaBlock}>
              <div className={styles.titleFaceKaaba}>Face the Kaaba</div>
              <div className={styles.diskFaceKaaba}>
                Use the map to align yourself correctly for Salah.
              </div>
              <div className={styles.qiblaBlockRow}>
                <div onClick={handleMapClick} className={styles.mapContainer}>
                  <QiblaMap onMapClick={handleMapClick} />
                </div>
                <div
                  onClick={handleCompassClick}
                  className={styles.compassContainer}
                >
                  <QiblaCompass
                    permissionGranted={sensorPermission === "granted"}
                    coords={coords}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <MenuBlocks />
      </div>
    </PageWrapper>
  );
};