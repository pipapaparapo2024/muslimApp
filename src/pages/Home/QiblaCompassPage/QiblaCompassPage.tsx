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
  const [localPermission, setLocalPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "prompt"
  );

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
          setLocalPermission("granted");
        } else {
          // При отказе оставляем "prompt"
          localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
          setLocalPermission("prompt");
        }
      } else {
        // На устройствах, где разрешение не требуется
        window.addEventListener("deviceorientation", () => {}, { once: true });
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setLocalPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "prompt");
      setLocalPermission("prompt");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Автоматически запрашиваем разрешение при каждом входе на вкладку компаса
  // если разрешение еще не получено
  useEffect(() => {
    if (activeTab === "compass" && localPermission !== "granted") {
      requestSensorPermission();
    }
  }, [activeTab, localPermission]);

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

      {activeTab === "compass" && localPermission === "prompt" && !isRequestingPermission && (
        <div className={styles.permissionPrompt}>
          <p>{t("sensorPermissionRequired")}</p>
          <button onClick={requestSensorPermission}>
            {t("allowSensors")}
          </button>
        </div>
      )}

      <div className={styles.tabContent}>
        {activeTab === "compass" ? (
          localPermission === "granted" ? (
            <div className={styles.bigCompass}>
              <QiblaCompass
                permissionGranted={true}
                coords={coords}
                showAngle={true}
                size={300}
              />
            </div>
          ) : (
            // Показываем сообщение о необходимости разрешения вместо компаса
            <div className={styles.permissionRequired}>
              <p>{t("sensorPermissionRequiredToUseCompass")}</p>
            </div>
          )
        ) : (
          <div>
            <QiblaMap fullscreen={true} />
          </div>
        )}
      </div>
    </PageWrapper>
  );
};