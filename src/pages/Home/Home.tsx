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
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  console.log("📱 iOS device detection:", isIOSDevice, "UserAgent:", navigator.userAgent);
  return isIOSDevice;
};

// Проверяем, требуется ли запрос разрешения
const requiresPermission = () => {
  const hasRequestPermission = isIOS() &&
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function";
  
  console.log("🔍 Requires permission check:", {
    isIOS: isIOS(),
    hasDeviceOrientation: typeof DeviceOrientationEvent !== "undefined",
    hasRequestPermission: typeof (DeviceOrientationEvent as any).requestPermission === "function",
    result: hasRequestPermission
  });
  
  return hasRequestPermission;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useGeoStore();

  const [sensorPermission, setSensorPermission] = useState<string>("prompt");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  console.log("🏠 Home component render - Sensor permission:", sensorPermission, "Requesting:", isRequestingPermission);

  // Функция запроса разрешения
  const requestSensorPermission = useCallback(async () => {
    console.log("🔄 Starting sensor permission request...");
    setIsRequestingPermission(true);
    
    try {
      if (requiresPermission()) {
        console.log("📱 iOS device detected, requesting permission...");
        // iOS - запрашиваем разрешение
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        console.log("✅ iOS permission request result:", result);
        setSensorPermission(result);
      } else {
        console.log("🤖 Non-iOS device, permission granted automatically");
        // Android и другие устройства - разрешение не требуется
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("❌ Sensor permission error:", err);
      setSensorPermission("denied");
    } finally {
      console.log("🏁 Permission request finished");
      setIsRequestingPermission(false);
    }
  }, []);

  // Обработка клика на компас
  const handleCompassClick = useCallback(async () => {
    console.log("🧭 Compass clicked, current permission:", sensorPermission);
    
    if (sensorPermission === "denied") {
      console.warn("🚫 Permission denied, showing alert");
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "prompt" && requiresPermission()) {
      console.log("📱 iOS device needs permission, requesting...");
      // iOS - нужно запросить разрешение
      setIsRequestingPermission(true);
      try {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        console.log("✅ Inline permission request result:", result);
        setSensorPermission(result);

        if (result === "granted") {
          console.log("🎉 Permission granted, navigating to qibla compass");
          navigate("/qibla", { state: { activeTab: "compass" } });
        } else {
          console.warn("❌ Permission not granted, showing alert");
          alert(t("sensorPermissionRequired"));
        }
      } catch (err) {
        console.error("❌ Inline permission request error:", err);
        setSensorPermission("denied");
        alert(t("sensorPermissionError"));
      } finally {
        setIsRequestingPermission(false);
      }
    } else {
      console.log("➡️ Permission already granted or not required, navigating to qibla compass");
      // Разрешение уже есть или не требуется
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, navigate]);

  const handleMapClick = useCallback(() => {
    console.log("🗺️ Map clicked, navigating to qibla map");
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  // Функция для открытия настроек iOS (если возможно)
  const openSettings = useCallback(() => {
    if (isIOS()) {
      // Попытка открыть настройки Safari
      window.open('app-settings:');
    }
  }, []);

  const showPermissionButton = requiresPermission() && 
                             sensorPermission !== "granted" && 
                             sensorPermission !== "denied";
  
  console.log("👀 Show permission button:", showPermissionButton);

  return (
    <PageWrapper>
      <Header />

      {/* Кнопка запроса доступа к датчикам */}
      {showPermissionButton && (
        <button
          className={styles.allowSensorButton}
          onClick={requestSensorPermission}
          disabled={isRequestingPermission}
        >
          {isRequestingPermission ? t("requesting") : t("allowSensors")}
        </button>
      )}

      {/* Сообщение об отказе с инструкцией */}
      {sensorPermission === "denied" && (
        <div className={styles.permissionDeniedMessage}>
          <p>{t("sensorPermissionDeniedMessage")}</p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
            {t("sensorPermissionInstructions")}
          </p>
          <button 
            onClick={openSettings}
            className={styles.settingsButton}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {t("openSettings")}
          </button>
        </div>
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