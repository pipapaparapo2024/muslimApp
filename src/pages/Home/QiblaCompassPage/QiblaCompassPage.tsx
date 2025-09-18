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
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        setSensorPermission(result);
      } else {
        // На устройствах, где разрешение не требуется
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
      setSensorPermission("prompt");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Автоматически запрашиваем разрешение при каждом входе на вкладку компаса
  useEffect(() => {
    if (activeTab === "compass" && sensorPermission === "prompt") {
      requestSensorPermission();
    }
  }, [activeTab, sensorPermission]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state, setActiveTab]);

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
            {/* Всегда показываем компас, но с разным состоянием */}
            <QiblaCompass
              permissionGranted={sensorPermission === "granted"}
              coords={coords}
              showAngle={true}
              size={300}
            />
            
            {/* Сообщение о необходимости разрешения */}
            {sensorPermission !== "granted" && (
              <div className={styles.permissionOverlay}>
                {isRequestingPermission ? (
                  <div className={styles.permissionMessage}>
                    {t("requestingSensorPermission")}
                  </div>
                ) : (
                  <div className={styles.permissionMessage}>
                    <p>{t("sensorPermissionRequired")}</p>
                    <button 
                      onClick={requestSensorPermission}
                      className={styles.permissionButton}
                    >
                      {t("allowSensors")}
                    </button>
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