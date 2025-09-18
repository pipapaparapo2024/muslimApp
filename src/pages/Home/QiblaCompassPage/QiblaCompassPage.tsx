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

  // Функция для запроса разрешения на доступ к датчикам
  const requestSensorPermission = async () => {
    setIsRequestingPermission(true);
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (result === "granted") {
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        } else {
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
        }
      } else {
        // На устройствах, где разрешение не требуется
        window.addEventListener("deviceorientation", () => {}, { once: true });
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Запрос разрешения при монтировании компонента, если вкладка "compass"
  useEffect(() => {
    if (activeTab === "compass") {
      const permissionStatus = localStorage.getItem(SENSOR_PERMISSION_STATUS);
      
      if (permissionStatus !== "granted") {
        requestSensorPermission();
      }
    }
  }, [activeTab]);

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

      {isRequestingPermission && (
        <div className={styles.permissionRequest}>
          {t("requestingSensorPermission")}
        </div>
      )}

      <div className={styles.tabContent}>
        {activeTab === "compass" ? (
          <div className={styles.bigCompass}>
            <QiblaCompass
              permissionGranted={
                localStorage.getItem(SENSOR_PERMISSION_STATUS) === "granted"
              }
              coords={coords}
              showAngle={true}
              size={300}
            />
          </div>
        ) : (
          <div>
            <QiblaMap fullscreen={true} />
          </div>
        )}
      </div>
    </PageWrapper>
  );
};