import React, { useState, useCallback } from "react";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { useGeoStore } from "../../hooks/useGeoStore";
import { QiblaMap } from "./QiblaCompass/QiblaMap";
import { Header } from "../../components/header/Header";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";

// Проверяем, является ли устройство iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Проверяем, требуется ли запрос разрешения
const requiresPermission = () => {
  return isIOS() && 
         typeof DeviceOrientationEvent !== "undefined" && 
         (DeviceOrientationEvent as any).requestPermission;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useGeoStore();
  
  const [sensorPermission, setSensorPermission] = useState<string>("prompt");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Функция запроса разрешения
  const requestSensorPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      if (requiresPermission()) {
        // iOS - запрашиваем разрешение
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
      } else {
        // Android и другие устройства - разрешение не требуется
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      setSensorPermission("denied");
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  // Обработка клика на компас
  const handleCompassClick = useCallback(async () => {
    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt" && requiresPermission()) {
      // iOS - нужно запросить разрешение
      setIsRequestingPermission(true);
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setSensorPermission(result);
        
        if (result === "granted") {
          navigate("/qibla", { state: { activeTab: "compass" } });
        } else {
          alert(t("sensorPermissionRequired"));
        }
      } catch (err) {
        console.error("Sensor permission error:", err);
        setSensorPermission("denied");
        alert(t("sensorPermissionError"));
      } finally {
        setIsRequestingPermission(false);
      }
    } else {
      // Разрешение уже есть или не требуется
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  return (
    <PageWrapper>
      <Header />

      {/* Кнопка запроса доступа к датчикам */}
      {requiresPermission() && sensorPermission !== "granted" && (
        <button
          className={styles.allowSensorButton}
          onClick={requestSensorPermission}
          disabled={isRequestingPermission}
        >
          {isRequestingPermission ? t("requesting") : t("allowSensors")}
        </button>
      )}

      <div className={styles.homeRoot}>
        {isLoading && (
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
          </div>
        )}

        {error && <div className={styles.errorContainer}>{error}</div>}

        {!isLoading && !error && (
          <>
            <div className={styles.prayerTimesQiblaContainer}>
              <PrayerTimes />

              <div className={styles.qiblaBlock}>
                <div className={styles.titleFaceKaaba}>{t("faceTheKaaba")}</div>
                <div className={styles.diskFaceKaaba}>
                  {t("useMapForSalah")}
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
                    />
                  </div>
                </div>
              </div>
              <div className={styles.locationMay}>{t("locationMay")}</div>
            </div>

            <MenuBlocks />
          </>
        )}
      </div>
    </PageWrapper>
  );
};