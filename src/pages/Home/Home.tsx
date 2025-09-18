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
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  console.log(
    "📱 iOS device detection:",
    isIOSDevice,
    "UserAgent:",
    navigator.userAgent
  );
  return isIOSDevice;
};

// Проверяем, требуется ли запрос разрешения
const requiresPermission = () => {
  // Для iOS 13+ требуется явное разрешение
  const isIOS13OrNewer = isIOS() && typeof DeviceOrientationEvent !== "undefined";
  
  const hasRequestPermission = 
    isIOS13OrNewer &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function";

  console.log("🔍 Requires permission check:", {
    isIOS: isIOS(),
    isIOS13OrNewer,
    hasRequestPermission,
    result: hasRequestPermission,
  });

  return hasRequestPermission;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useGeoStore();

  const [sensorPermission, setSensorPermission] = useState<string>("prompt");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  console.log(
    "🏠 Home component render - Sensor permission:",
    sensorPermission,
    "Requesting:",
    isRequestingPermission
  );

  // Функция запроса разрешения (исправленная)
  const requestSensorPermission = useCallback(async () => {
    console.log("🔄 Starting sensor permission request...");
    setIsRequestingPermission(true);

    try {
      if (requiresPermission()) {
        console.log("📱 iOS device detected, requesting permission...");
        
        // Важно: вызываем через setTimeout для обхода ограничений iOS
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Правильный вызов requestPermission
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        
        console.log("✅ iOS permission request result:", result);
        setSensorPermission(result);
        
        if (result === "granted") {
          console.log("🎉 Permission granted successfully!");
        } else {
          console.warn("❌ Permission denied by user");
        }
      } else {
        console.log("🤖 Non-iOS device, permission granted automatically");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("❌ Sensor permission error:", err);
      // Более детальная обработка ошибок
      if ((err as Error).name === "NotAllowedError") {
        setSensorPermission("denied");
      } else if ((err as Error).name === "SecurityError") {
        console.warn("🔒 Security error - may need HTTPS");
        setSensorPermission("denied");
      } else {
        setSensorPermission("denied");
      }
    } finally {
      console.log("🏁 Permission request finished");
      setIsRequestingPermission(false);
    }
  }, []);

  // Обработка клика на компас (исправленная логика сравнения)
  const handleCompassClick = useCallback(async () => {
    console.log("🧭 Compass clicked, current permission:", sensorPermission);

    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    // Исправленное сравнение - используем строгое равенство
    if (sensorPermission === "prompt") {
      // Если разрешение еще не запрошено, запрашиваем его
      await requestSensorPermission();
      
      // После запроса проверяем результат (используем текущее значение из состояния)
      // Не можем использовать sensorPermission здесь напрямую, так как состояние обновится асинхронно
      // Вместо этого используем колбэк для получения актуального значения
      setSensorPermission(prevPermission => {
        if (prevPermission === "granted") {
          navigate("/qibla", { state: { activeTab: "compass" } });
        }
        return prevPermission;
      });
    } else if (sensorPermission === "granted") {
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, navigate, requestSensorPermission]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  // Функция для открытия настроек iOS
  const openSettings = useCallback(() => {
    if (isIOS()) {
      // Попытка открыть настройки
      try {
        // Для веб-приложений
        window.open("app-settings:");
        
        // Альтернативный способ для некоторых браузеров
        setTimeout(() => {
          window.location.href = "App-Prefs:root=SAFARI";
        }, 500);
      } catch (err) {
        console.error("Failed to open settings:", err);
        alert(t("openSettingsManually"));
      }
    }
  }, []);

  const showPermissionButton =
    requiresPermission() &&
    sensorPermission !== "granted" &&
    sensorPermission !== "denied";

  console.log("👀 Show permission button:", showPermissionButton);

  return (
    <PageWrapper>
      <Header />

      {/* Кнопка запроса доступа к датчикам */}
      {showPermissionButton && (
        <div className={styles.permissionSection}>
          <p>{t("sensorPermissionRequired")}</p>
          <button
            className={styles.allowSensorButton}
            onClick={requestSensorPermission}
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? t("requesting") : t("allowSensors")}
          </button>
        </div>
      )}

      {/* Сообщение об отказе */}
      {sensorPermission === "denied" && (
        <div className={styles.permissionDeniedMessage}>
          <p>{t("sensorPermissionDeniedMessage")}</p>
          <p className={styles.instructions}>
            {t("sensorPermissionInstructions")}
          </p>
          <button
            onClick={openSettings}
            className={styles.settingsButton}
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
                    {/* Исправлено: убрано isRequestingPermission, если компонент его не принимает */}
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