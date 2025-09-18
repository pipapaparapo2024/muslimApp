import React, { useState, useCallback, useEffect } from "react";
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
  const isIOSDevice = isIOS();
  const hasRequestPermission = 
    isIOSDevice &&
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function";

  console.log("🔍 Requires permission check:", {
    isIOS: isIOSDevice,
    hasRequestPermission,
  });

  return hasRequestPermission;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useGeoStore();

  const [sensorPermission, setSensorPermission] = useState<string>("prompt");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);

  console.log(
    "🏠 Home component render - Sensor permission:",
    sensorPermission,
    "Requesting:",
    isRequestingPermission
  );

  // Проверяем начальное состояние разрешения
  useEffect(() => {
    // Для не-iOS устройств автоматически даем разрешение
    if (!requiresPermission()) {
      setSensorPermission("granted");
    }
  }, []);

  // Функция запроса разрешения - ДОЛЖНА вызываться напрямую из обработчика клика
  const requestSensorPermissionDirect = useCallback(async () => {
    console.log("🔄 Direct permission request called");
    
    if (!requiresPermission()) {
      console.log("🤖 Non-iOS device, permission granted automatically");
      setSensorPermission("granted");
      return "granted";
    }

    setIsRequestingPermission(true);
    setShowPermissionRequest(false);

    try {
      console.log("📱 iOS - calling requestPermission directly...");
      
      // ВАЖНО: вызываем напрямую без setTimeout и других оберток
      const result = await (DeviceOrientationEvent as any).requestPermission();
      
      console.log("✅ iOS permission request result:", result);
      setSensorPermission(result);
      
      if (result === "granted") {
        console.log("🎉 Permission granted successfully!");
        // Автоматически переходим к компасу после получения разрешения
        setTimeout(() => {
          navigate("/qibla", { state: { activeTab: "compass" } });
        }, 100);
      }
      
      return result;
    } catch (err) {
      console.error("❌ Sensor permission error:", err);
      setSensorPermission("denied");
      return "denied";
    } finally {
      setIsRequestingPermission(false);
    }
  }, [navigate]);

  // Обработка клика на компас
  const handleCompassClick = useCallback(async () => {
    console.log("🧭 Compass clicked, current permission:", sensorPermission);

    if (sensorPermission === "denied") {
      alert(t("sensorPermissionDeniedMessage"));
      return;
    }

    if (sensorPermission === "granted") {
      navigate("/qibla", { state: { activeTab: "compass" } });
      return;
    }

    // Для iOS показываем кнопку запроса разрешения
    if (requiresPermission()) {
      setShowPermissionRequest(true);
    } else {
      // Для других устройств сразу переходим
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  }, [sensorPermission, navigate]);

  const handleMapClick = useCallback(() => {
    navigate("/qibla", { state: { activeTab: "map" } });
  }, [navigate]);

  // Функция для открытия настроек iOS
  const openSettings = useCallback(() => {
    if (isIOS()) {
      try {
        // Попытка открыть настройки Safari
        window.location.href = 'app-settings:';
      } catch (err) {
        console.error("Failed to open settings:", err);
        alert("Пожалуйста, откройте настройки Safari вручную и разрешите доступ к датчикам движения");
      }
    }
  }, []);

  const showPermissionButton = requiresPermission() && sensorPermission === "prompt";
  const showPermissionRequestModal = showPermissionRequest && sensorPermission === "prompt";

  return (
    <PageWrapper>
      <Header />

      {/* Модальное окно запроса разрешения */}
      {showPermissionRequestModal && (
        <div className={styles.permissionModal}>
          <div className={styles.modalContent}>
            <h3>{t("sensorPermissionRequired")}</h3>
            <p>{t("sensorPermissionMessage")}</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowPermissionRequest(false)}
              >
                {t("cancel")}
              </button>
              <button
                className={styles.allowButton}
                onClick={requestSensorPermissionDirect}
                disabled={isRequestingPermission}
              >
                {isRequestingPermission ? t("requesting") : t("allow")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка запроса доступа к датчикам */}
      {showPermissionButton && !showPermissionRequestModal && (
        <div className={styles.permissionSection}>
          <p>{t("sensorPermissionRequired")}</p>
          <button
            className={styles.allowSensorButton}
            onClick={() => setShowPermissionRequest(true)}
            disabled={isRequestingPermission}
          >
            {t("allowSensors")}
          </button>
        </div>
      )}

      {/* Сообщение об отказе */}
      {sensorPermission === "denied" && (
        <div className={styles.permissionDeniedMessage}>
          <p>{t("sensorPermissionDeniedMessage")}</p>
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