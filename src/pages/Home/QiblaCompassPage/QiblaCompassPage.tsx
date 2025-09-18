import React, { useEffect, useState } from "react";
import { QiblaMap } from "../QiblaCompass/QiblaMap";
import { QiblaCompass } from "../QiblaCompass/QiblaCompass";
import styles from "./QiblaCompassPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useQiblaCompassPageStore } from "../../../hooks/useQiblaCompassPageStore";
import { Compass, Map, Navigation, AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useGeoStore } from "../../../hooks/useGeoStore";
import { t } from "i18next";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Функция для логирования
const logSensorEvent = (event: string, details?: any) => {
  console.log(`[QiblaCompass] ${event}`, details || '');
};

export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  const { coords } = useGeoStore();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [sensorPermission, setSensorPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "prompt"
  );

  // Функция для запроса разрешения
  const requestSensorPermission = async () => {
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

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    
    // Логируем переход на страницу
    logSensorEvent('page_loaded', { 
      activeTab: location.state?.activeTab || 'compass',
      previousPermission: sensorPermission 
    });
  }, [location.state, setActiveTab, sensorPermission]);

  // Логируем изменения вкладок
  useEffect(() => {
    logSensorEvent('tab_changed', { activeTab });
  }, [activeTab]);

  return (
    <PageWrapper showBackButton>
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
              
              {/* Сообщение о необходимости разрешения */}
              {sensorPermission !== "granted" && (
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