import React, { useEffect, useState } from "react";
import { QiblaMap } from "../QiblaCompass/QiblaMap";
import { QiblaCompass } from "../QiblaCompass/QiblaCompass";
import styles from "./QiblaCompassPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useQiblaCompassPageStore } from "../../../hooks/useQiblaCompassPageStore";
import { Compass, Map, Navigation, AlertCircle, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useGeoStore } from "../../../hooks/useGeoStore";
import { t } from "i18next";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Функция для логирования
const logSensorEvent = (event: string, details?: any) => {
  console.log(`[QiblaCompass] ${event}`, details || '');
};

// Проверяем, находится ли приложение в Telegram
const isInTelegram = () => {
  return navigator.userAgent.includes('Telegram') || 
         window.Telegram?.WebApp?.initData !== undefined;
};

export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  const { coords } = useGeoStore();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<string>(() => {
    const saved = localStorage.getItem(SENSOR_PERMISSION_STATUS);
    // В Telegram по умолчанию считаем, что разрешение есть
    if (isInTelegram() && (!saved || saved === "prompt")) {
      return "granted";
    }
    return saved || "prompt";
  });

  // Функция для запроса разрешения
  const requestSensorPermission = async () => {
    // В Telegram всегда даем разрешение автоматически
    if (isInTelegram()) {
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
      setSensorPermission("granted");
      logSensorEvent('permission_auto_granted_in_telegram');
      return;
    }

    setIsRequestingPermission(true);
    logSensorEvent('permission_request_started');
    
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        logSensorEvent('native_permission_api_available');
        
        const result = await (DeviceOrientationEvent as any).requestPermission();
        logSensorEvent('permission_result_received', { result });
        
        localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        setSensorPermission(result);
        
        if (result === "granted") {
          logSensorEvent('permission_granted');
        } else {
          logSensorEvent('permission_denied');
        }
      } else {
        // На устройствах, где разрешение не требуется
        logSensorEvent('permission_not_required');
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      logSensorEvent('permission_error', { error: err });
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
      setSensorPermission("prompt");
    } finally {
      setIsRequestingPermission(false);
      logSensorEvent('permission_request_completed');
    }
  };

  // Функция для сброса разрешения
  const resetSensorPermission = () => {
    localStorage.removeItem(SENSOR_PERMISSION_STATUS);
    setSensorPermission("prompt");
    logSensorEvent('permission_reset');
  };

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    
    // Логируем переход на страницу
    logSensorEvent('page_loaded', { 
      activeTab: location.state?.activeTab || 'compass',
      previousPermission: sensorPermission,
      inTelegram: isInTelegram()
    });

    // Автоматически запрашиваем разрешение если нужно (только не в Telegram)
    if (activeTab === "compass" && sensorPermission === "prompt" && !isInTelegram()) {
      requestSensorPermission();
    }
  }, [location.state, setActiveTab, sensorPermission, activeTab]);

  // Логируем изменения вкладок
  useEffect(() => {
    logSensorEvent('tab_changed', { activeTab });
  }, [activeTab]);

  return (
    <PageWrapper showBackButton>
      <div className={styles.header}>
        <Navigation size={24} className={styles.qiblaIcon} />
        <h1 className={styles.title}>{t("qiblaDirection")}</h1>
        {sensorPermission === "denied" && (
          <button onClick={resetSensorPermission} className={styles.resetButton}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className={styles.toggleGroup}>
        <label className={styles.toggleItem}>
          <input
            type="radio"
            name="tab"
            checked={activeTab === "compass"}
            onChange={() => setActiveTab("compass")}
            className={styles.toggleInput}
          />
          <span className={styles.toggleSlider}>
            <Compass size={18} strokeWidth={2} /> 
            <span className={styles.toggleText}>{t("compass")}</span>
          </span>
        </label>

        <label className={styles.toggleItem}>
          <input
            type="radio"
            name="tab"
            checked={activeTab === "map"}
            onChange={() => setActiveTab("map")}
            className={styles.toggleInput}
          />
          <span className={styles.toggleSlider}>
            <Map size={18} strokeWidth={2} /> 
            <span className={styles.toggleText}>{t("map")}</span>
          </span>
        </label>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "compass" ? (
          <div className={styles.compassSection}>
            <div className={styles.compassContainer}>
              <QiblaCompass
                permissionGranted={sensorPermission === "granted"}
                coords={coords}
                showAngle={true}
                size={280}
              />
              
              {/* Сообщение о необходимости разрешения (только не в Telegram) */}
              {!isInTelegram() && sensorPermission !== "granted" && (
                <div className={styles.permissionOverlay}>
                  {isRequestingPermission ? (
                    <div className={styles.permissionMessage}>
                      <div className={styles.loadingSpinner}></div>
                      <p>{t("requestingSensorPermission")}</p>
                    </div>
                  ) : sensorPermission === "denied" ? (
                    <div className={styles.permissionMessage}>
                      <AlertCircle size={32} className={styles.alertIcon} />
                      <h3>{t("sensorPermissionDenied")}</h3>
                      <p className={styles.helpText}>
                        {t("sensorPermissionHelp")}
                      </p>
                      <button 
                        onClick={requestSensorPermission}
                        className={styles.retryButton}
                      >
                        {t("tryAgain")}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.permissionMessage}>
                      <AlertCircle size={32} className={styles.alertIcon} />
                      <h3>{t("sensorPermissionRequired")}</h3>
                      <p className={styles.helpText}>
                        {t("sensorPermissionDescription")}
                      </p>
                      <button 
                        onClick={requestSensorPermission}
                        className={styles.allowButton}
                      >
                        {t("allowSensors")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Информация о направлении */}
            {sensorPermission === "granted" && (
              <div className={styles.directionInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t("qiblaAngle")}:</span>
                  <span className={styles.infoValue}>0°</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t("yourDirection")}:</span>
                  <span className={styles.infoValue}>N</span>
                </div>
                <p className={styles.instruction}>
                  {t("qiblaInstruction")}
                </p>
                {isInTelegram() && (
                  <p className={styles.telegramNote}>
                    {t("telegramSensorNote")}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.mapSection}>
            <div className={styles.mapContainer}>
              <QiblaMap fullscreen={true} />
            </div>
            <div className={styles.mapInfo}>
              <p>{t("mapInstruction")}</p>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};