// src/pages/Home/Home.tsx
import React, { useEffect } from "react";
// import { useUserStore } from "../../api/useUserSlice";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { QiblaMap } from "./QiblaCompass/QiblaMap";

import { useGeoStore } from "./GeoStore";
import { useCompassStore } from "./QiblaCompass/QiblaCompassStore";
import { Header } from "../../components/Header";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useUserStore();
  const {
    coords,
    city,
    country,
    isLoading,
    error,
    isInitialized,
    fetchFromIpApi,
  } = useGeoStore();
  const { fetchQibla } = useCompassStore();
  useEffect(() => {
    // Ждём, пока persist загрузит данные
    if (isInitialized && !coords && !isLoading && !error) {
      fetchFromIpApi();
    }
  }, [isInitialized, coords, isLoading, error, fetchFromIpApi]);
  // Запрос разрешений на сенсоры (для компаса)
  useEffect(() => {
    const permissionsRequested = localStorage.getItem(
      "sensorPermissionsRequested"
    );
    if (permissionsRequested) return;

    const handleFirstInteraction = () => {
      if ((DeviceOrientationEvent as any)?.requestPermission) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .catch(() => {})
          .finally(() => {
            localStorage.setItem("sensorPermissionsRequested", "1");
          });
      } else {
        localStorage.setItem("sensorPermissionsRequested", "1");
      }

      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("click", handleFirstInteraction, { once: true });
  }, []);

  // Пересчитываем направление на Каабу
  useEffect(() => {
    if (coords) {
      fetchQibla(coords);
    }
  }, [coords, fetchQibla]);

  // Telegram UI
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
        {/* Показываем лоадер или ошибку */}
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
                <div onClick={handleMapClick}>
                  <QiblaMap />
                </div>
                <div onClick={handleCompassClick}>
                  <QiblaCompass />
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
