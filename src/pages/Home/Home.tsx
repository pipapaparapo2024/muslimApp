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

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    coords,
    city,
    country,
    isLoading,
    error,
    isInitialized,
    fetchFromIpApi,
  } = useGeoStore();
  
  useEffect(() => {
    // Ждём, пока persist загрузит данные
    if (isInitialized && !coords && !isLoading && !error) {
      fetchFromIpApi();
    }
  }, [isInitialized, coords, isLoading, error, fetchFromIpApi]);
  
  // Автоматический запрос разрешений на сенсоры
  useEffect(() => {
    const permissionsRequested = localStorage.getItem("sensorPermissionsRequested");
    if (permissionsRequested) return;

    const requestSensorPermissions = async () => {
      try {
        // Запрос разрешения на ориентацию (для iOS)
        if ((DeviceOrientationEvent as any)?.requestPermission) {
          try {
            await (DeviceOrientationEvent as any).requestPermission();
          } catch (error) {
            console.warn("Orientation permission denied:", error);
          }
        }

        localStorage.setItem("sensorPermissionsRequested", "1");
      } catch (error) {
        console.error("Error requesting sensor permissions:", error);
      }
    };

    // Запрашиваем разрешения только если пользователь взаимодействовал со страницей
    const handleInteraction = () => {
      requestSensorPermissions();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
  }, []);

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
                <div onClick={handleMapClick} className={styles.mapContainer}>
                  <QiblaMap onMapClick={handleMapClick} />
                </div>
                <div onClick={handleCompassClick} className={styles.compassContainer}>
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