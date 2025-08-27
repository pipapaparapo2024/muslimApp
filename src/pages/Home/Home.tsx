import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { QiblaMap } from "./QiblaCompass/QiblaMap";
import { useGeoStore } from "./GeoStore";
import { Header } from "../../components/Header";

// Ключи для localStorage
const GEO_PERMISSION_STATUS = "geoPermissionStatus"; 
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus"; 
const CACHED_LOCATION = "cachedLocation"; 

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    coords,
    city,
    country,
    isLoading,
    error,
    fetchFromIpApi,
    hasRequestedGeo,
    updateCoords // Добавляем функцию обновления координат в store
  } = useGeoStore();

  // Флаги для отслеживания уже выполненных запросов
  const geoRequested = useRef(false);
  const sensorRequested = useRef(false);

  // --- 1. Геолокация: один раз при монтировании ---
  useEffect(() => {
    if (geoRequested.current) return;
    geoRequested.current = true;

    const status = localStorage.getItem(GEO_PERMISSION_STATUS);
    const cached = localStorage.getItem(CACHED_LOCATION);

    // Если есть кэш и он свежий (<24ч), используем
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
        if (isFresh && data.lat && data.lon) {
          // Обновляем store с кэшированными координатами
          updateCoords({ lat: data.lat, lon: data.lon });
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached location", e);
      }
    }

    // Если разрешение уже отклонено — fallback на IP
    if (status === "denied") {
      if (!coords && !hasRequestedGeo && !isLoading) {
        fetchFromIpApi();
      }
      return;
    }

    // Если разрешение уже предоставлено, но нет кэша
    if (status === "granted") {
      if (!coords && !hasRequestedGeo && !isLoading) {
        // Запрашиваем геолокацию снова
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude: lat, longitude: lon } = position.coords;
            const locationData = { lat, lon, timestamp: Date.now() };
            localStorage.setItem(CACHED_LOCATION, JSON.stringify(locationData));
            updateCoords({ lat, lon });
          },
          () => {
            // При ошибке используем IP
            fetchFromIpApi();
          }
        );
      }
      return;
    }

    // Первый запрос геолокации
    if (!status || status === "unknown") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          const locationData = { lat, lon, timestamp: Date.now() };
          localStorage.setItem(CACHED_LOCATION, JSON.stringify(locationData));
          localStorage.setItem(GEO_PERMISSION_STATUS, "granted");
          updateCoords({ lat, lon });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          localStorage.setItem(GEO_PERMISSION_STATUS, "denied");
          if (!coords && !hasRequestedGeo && !isLoading) {
            fetchFromIpApi();
          }
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  }, [coords, hasRequestedGeo, isLoading, fetchFromIpApi, updateCoords]);

  // --- 2. Доступ к датчикам (deviceorientation) - один раз ---
  useEffect(() => {
    if (sensorRequested.current) return;
    sensorRequested.current = true;

    const permissionStatus = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    
    // Если уже есть решение, не запрашиваем снова
    if (permissionStatus === "granted" || permissionStatus === "denied") {
      return;
    }

    const requestSensors = async () => {
      try {
        const DeviceOrientationEventAny = DeviceOrientationEvent as any;
        if (DeviceOrientationEventAny?.requestPermission) {
          // iOS - требуется явное разрешение
          const result = await DeviceOrientationEventAny.requestPermission();
          localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        } else {
          // Android и другие - разрешение не требуется
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
      }
    };

    // Запрашиваем разрешение сразу при загрузке
    requestSensors();
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

  const handleCompassClick = () =>
    navigate("/qibla", { state: { activeTab: "compass" } });
  const handleMapClick = () =>
    navigate("/qibla", { state: { activeTab: "map" } });

  // Получаем статус разрешения для сенсоров
  const sensorPermissionGranted = localStorage.getItem(SENSOR_PERMISSION_STATUS) === "granted";

  return (
    <PageWrapper>
      Проверка на Работу 
      <Header
        city={city || "Unknown city"}
        country={country?.name || "Unknown country"}
      />
      <div className={styles.homeRoot}>
        {isLoading && !coords && (
          <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            Определяем ваше местоположение...
          </div>
        )}

        {error && !coords && (
          <div style={{ padding: "16px", textAlign: "center", color: "red" }}>
            Не удалось определить местоположение
          </div>
        )}

        {!isLoading && (coords || city) && (
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
                    permissionGranted={sensorPermissionGranted}
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