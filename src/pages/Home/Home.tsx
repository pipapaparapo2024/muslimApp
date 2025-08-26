import React, { useEffect } from "react";
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
  } = useGeoStore();

  // --- 1. Геолокация: один раз ---
  useEffect(() => {
    const status = localStorage.getItem(GEO_PERMISSION_STATUS);
    const cached = localStorage.getItem(CACHED_LOCATION);

    // Если есть кэш и он свежий (<24ч), используем
    if (cached) {
      const data = JSON.parse(cached);
      const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
      if (isFresh && !coords) {
        // Можно обновить store, если нужно
        // например: updateCoords({ lat: data.lat, lon: data.lon });
      }
      return;
    }

    // Если отклонено — fallback на IP
    if (status === "denied") {
      if (!coords && !hasRequestedGeo && !isLoading) {
        fetchFromIpApi();
      }
      return;
    }

    // Если не запрашивали — запрашиваем
    if (!status || status === "unknown") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          const locationData = { lat, lon, timestamp: Date.now() };

          localStorage.setItem(CACHED_LOCATION, JSON.stringify(locationData));
          localStorage.setItem(GEO_PERMISSION_STATUS, "granted");

          // Здесь можно обновить store, если нужно
          // Например: updateCoords({ lat, lon });
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
  }, [coords, hasRequestedGeo, isLoading, fetchFromIpApi]);

  // --- 2. Доступ к датчикам (deviceorientation) ---
  useEffect(() => {
    const permissionStatus = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    if (permissionStatus === "granted" || permissionStatus === "denied") {
      return; // Уже решено
    }

    const requestSensors = async () => {
      try {
        const DeviceOrientationEventAny = (DeviceOrientationEvent as any);
        if (DeviceOrientationEventAny?.requestPermission) {
          const result = await DeviceOrientationEventAny.requestPermission();
          if (result === "granted") {
            localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
          } else {
            localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
          }
        } else {
          // На Android и других — разрешение не требуется
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
      }
    };

    const handleInteraction = () => {
      requestSensors();
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
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

  return (
    <PageWrapper>
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
                    permissionGranted={localStorage.getItem(SENSOR_PERMISSION_STATUS) === "granted"}
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