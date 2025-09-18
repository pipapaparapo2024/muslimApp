import React, { useEffect, useState } from "react";
import { QiblaMap } from "../QiblaCompass/QiblaMap";
import { QiblaCompass } from "../QiblaCompass/QiblaCompass";
import styles from "./QiblaCompassPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useQiblaCompassPageStore } from "../../../hooks/useQiblaCompassPageStore";
import { Compass, Map } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useGeoStore } from "../../../hooks/useGeoStore";
import { t } from "i18next";

const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";

// Функция для логирования
const logSensorEvent = (event: string, details?: any) => {
  console.log(`[SensorPermission] ${event}`, details || '');
  // Здесь можно добавить отправку в аналитику (Google Analytics, Yandex.Metrica и т.д.)
  // analytics.track('sensor_permission', { event, ...details });
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

  // Автоматически запрашиваем разрешение при каждом входе на вкладку компаса
  // если разрешение еще не получено
  useEffect(() => {
    if (activeTab === "compass" && sensorPermission === "prompt") {
      logSensorEvent('auto_permission_request_triggered');
      requestSensorPermission();
    }
  }, [activeTab, sensorPermission]);

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
            <Compass size={16} strokeWidth={1.5} /> {t("compass")}
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
            <Map size={16} strokeWidth={1.5} /> {t("map")}
          </span>
        </label>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "compass" ? (
          <div className={styles.compassContainer}>
            {/* Всегда показываем компас */}
            <QiblaCompass
              permissionGranted={sensorPermission === "granted"}
              coords={coords}
              showAngle={true}
              size={300}
            />
            
            {/* Сообщение о статусе разрешения */}
            {sensorPermission !== "granted" && (
              <div className={styles.permissionOverlay}>
                {isRequestingPermission ? (
                  <div className={styles.permissionMessage}>
                    {t("requestingSensorPermission")}
                  </div>
                ) : sensorPermission === "denied" ? (
                  <div className={styles.permissionMessage}>
                    <p>{t("sensorPermissionDenied")}</p>
                    <p className={styles.helpText}>
                      {t("sensorPermissionHelp")}
                    </p>
                  </div>
                ) : (
                  <div className={styles.permissionMessage}>
                    <p>{t("sensorPermissionRequesting")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.mapContainer}>
            <QiblaMap fullscreen={true} />
          </div>
        )}
      </div>
    </PageWrapper>
  );
};