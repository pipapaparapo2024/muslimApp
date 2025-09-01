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
import { t } from "i18next";

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
  const [sensorPermission, setSensorPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "unknown"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Функция для сброса и обновления данных геолокации
  const handleRefreshLocationData = async () => {
    setIsRefreshing(true);

    // Сбрасываем кэш IP данных
    localStorage.removeItem(IP_DATA_CACHE);
    localStorage.removeItem(CACHED_LOCATION);

    // Сбрасываем состояние геоданных
    setCoords(null);
    setCity(null);
    setCountry(null);
    setTimeZone(null);
    setError(null);

    // Сбрасываем флаги
    ipDataFetched.current = false;
    geoRequested.current = false;

    // Запрашиваем новые данные
    try {
      await fetchFromIpApi();
      ipDataFetched.current = true;

      // Если есть разрешение на геолокацию, также запрашиваем точные координаты
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

  // Функция для запроса геолокации
  const requestGeolocation = async () => {
    geoRequested.current = true;
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

  // Функция для автоматического запроса доступа к датчикам
  const requestSensorPermission = async () => {
    sensorRequested.current = true;

    try {
      // Проверяем поддержку API
      if (typeof DeviceOrientationEvent === 'undefined') {
        console.warn('DeviceOrientationEvent not supported');
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "unsupported");
        setSensorPermission("unsupported");
        return;
      }

      // iOS 13+ - используем обходной путь с setTimeout
      if ('requestPermission' in DeviceOrientationEvent) {
        // Для iOS используем небольшую задержку и пытаемся автоматически
        setTimeout(async () => {
          try {
            // Создаем скрытое событие для инициализации
            window.addEventListener('deviceorientation', () => {}, { once: true });
            
            // Пытаемся автоматически запросить разрешение
            const result = await (DeviceOrientationEvent as any).requestPermission();
            localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
            setSensorPermission(result);
          } catch (err) {
            console.log("iOS automatic sensor request failed, will request on interaction");
            // Если автоматический запрос не сработал, разрешим при первом взаимодействии
            localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
            setSensorPermission("prompt");
          }
        }, 1000);
      } 
      // Android и другие браузеры с Permissions API
      else if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ 
            name: 'gyroscope' as PermissionName 
          });
          localStorage.setItem(SENSOR_PERMISSION_STATUS, permission.state);
          setSensorPermission(permission.state);
          
          // Слушаем изменения разрешения
          permission.onchange = () => {
            setSensorPermission(permission.state);
            localStorage.setItem(SENSOR_PERMISSION_STATUS, permission.state);
          };
        } catch (err) {
          console.warn('Permissions API not fully supported:', err);
          // Для браузеров без Permissions API считаем разрешённым
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
          setSensorPermission("granted");
        }
      }
      // Fallback для старых браузеров - пробуем подписаться на событие
      else {
        try {
          // Пытаемся подписаться на событие ориентации
          const testHandler = () => {
            window.removeEventListener('deviceorientation', testHandler);
            localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
            setSensorPermission("granted");
          };
          
          window.addEventListener('deviceorientation', testHandler, { once: true });
          
          // Таймаут на случай если разрешение не дадут
          setTimeout(() => {
            window.removeEventListener('deviceorientation', testHandler);
            localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
            setSensorPermission("granted");
          }, 1000);
        } catch (err) {
          console.warn('Device orientation access failed:', err);
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
          setSensorPermission("granted");
        }
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
      setSensorPermission("granted");
    }
  };

  // Функция для принудительного запроса разрешения (при взаимодействии)
  const forceRequestSensorPermission = async () => {
    try {
      if ('requestPermission' in DeviceOrientationEvent) {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        setSensorPermission(result);
      }
    } catch (err) {
      console.error("Force sensor permission error:", err);
    }
  };

  useEffect(() => {
    if (geoRequested.current) return;

    const initializeLocation = async () => {
      geoRequested.current = true;

      const status = localStorage.getItem(GEO_PERMISSION_STATUS);
      const cached = localStorage.getItem(CACHED_LOCATION);

      // Проверяем кэш геолокации
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

      // Автоматически запрашиваем геолокацию
      if (!status || status === "unknown") {
        await requestGeolocation();
      } 
      // Если уже разрешено - используем точные координаты
      else if (status === "granted") {
        await requestGeolocation();
      }
      // Если отклонено - используем IP
      else if (status === "denied") {
        if (!ipDataFetched.current) {
          try {
            await fetchFromIpApi();
            ipDataFetched.current = true;
          } catch (error) {
            setError("Не удалось определить местоположение");
          }
        }
      }
    };

    initializeLocation();
  }, [settingsSent]);

  // Автоматический запрос доступа к датчикам при загрузке
  useEffect(() => {
    if (sensorRequested.current) return;

    const status = localStorage.getItem(SENSOR_PERMISSION_STATUS);

    // Если уже есть статус - используем его
    if (status === "granted" || status === "denied" || status === "unsupported") {
      setSensorPermission(status);
      return;
    }

    // Автоматически запрашиваем разрешение
    requestSensorPermission();
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
    // Если на iOS запрос еще не был выполнен, запрашиваем при клике
    if (sensorPermission === "prompt") {
      forceRequestSensorPermission();
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
        {/* Кнопка обновления данных местоположения */}
        <div className={styles.refreshButtonContainer}>
          <button
            className={styles.refreshLocationButton}
            onClick={handleRefreshLocationData}
            disabled={isRefreshing}
            title="Обновить данные местоположения"
          >
            {isRefreshing ? (
              <span>Обновление...</span>
            ) : (
              <span>🔄 Обновить местоположение</span>
            )}
          </button>
        </div>

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
              <div className={styles.titleFaceKaaba}>{t("faceTheKaaba")}</div>
              <div className={styles.diskFaceKaaba}>{t("useMapForSalah")}</div>
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
                  {/* Показываем подсказку если нужно взаимодействие */}
                  {sensorPermission === "prompt" && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#666',
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: '8px',
                      borderRadius: '8px'
                    }}>
                      Нажмите для доступа к датчикам
                    </div>
                  )}
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