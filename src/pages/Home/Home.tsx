import React, { useEffect, useRef, useState } from "react";
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
    updateCoords
  } = useGeoStore();

  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [showSensorPrompt, setShowSensorPrompt] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "unknown"
  );

  const geoRequested = useRef(false);
  const sensorRequested = useRef(false);

  // Функция для запроса геолокации с обработкой iOS
  const requestGeolocation = () => {
    geoRequested.current = true;
    setShowGeoPrompt(false);

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

    const status = localStorage.getItem(GEO_PERMISSION_STATUS);
    const cached = localStorage.getItem(CACHED_LOCATION);

    // Если есть кэш и он свежий, используем
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
        if (isFresh && data.lat && data.lon) {
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

    // Если разрешение уже предоставлено
    if (status === "granted") {
      if (!coords && !hasRequestedGeo && !isLoading) {
        requestGeolocation();
      }
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
  }, [coords, hasRequestedGeo, isLoading, fetchFromIpApi, updateCoords]);

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
        country={country?.name || "Unknown country"}
      />
      <div className={styles.homeRoot}>
        {/* Промпт для геолокации iOS */}
        {showGeoPrompt && (
          <div className={styles.permissionPrompt}>
            <h3>Разрешить доступ к геолокации?</h3>
            <p>Для точного определения киблы нужен доступ к вашему местоположению</p>
            <div className={styles.permissionButtons}>
              <button onClick={requestGeolocation}>Разрешить</button>
              <button onClick={() => {
                setShowGeoPrompt(false);
                localStorage.setItem(GEO_PERMISSION_STATUS, "denied");
                fetchFromIpApi();
              }}>Отказать</button>
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
              <button onClick={() => {
                setShowSensorPrompt(false);
                localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
                setSensorPermission("denied");
              }}>Отказать</button>
            </div>
          </div>
        )}

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