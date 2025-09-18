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

export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  const { coords } = useGeoStore();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Функция запроса разрешения
  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && 
          (DeviceOrientationEvent as any).requestPermission) {
        
        const result = await (DeviceOrientationEvent as any).requestPermission();
        setPermissionGranted(result === "granted");
      } else {
        // На устройствах где не нужно разрешение
        setPermissionGranted(true);
      }
    } catch (error) {
      console.error("Ошибка запроса разрешения:", error);
      setPermissionGranted(false);
    } finally {
      setIsRequesting(false);
    }
  };

  // При загрузке страницы и выборе вкладки компаса - запрашиваем разрешение
  useEffect(() => {
    if (activeTab === "compass") {
      requestPermission();
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

      {isRequesting && (
        <div className={styles.permissionRequest}>
          {t("requestingSensorPermission")}
        </div>
      )}

      {activeTab === "compass" && !permissionGranted && !isRequesting && (
        <div className={styles.permissionPrompt}>
          <p>{t("sensorPermissionRequired")}</p>
          <button onClick={requestPermission}>
            {t("allowSensors")}
          </button>
        </div>
      )}

      <div className={styles.tabContent}>
        {activeTab === "compass" ? (
          permissionGranted ? (
            <div className={styles.bigCompass}>
              <QiblaCompass
                permissionGranted={true}
                coords={coords}
                showAngle={true}
                size={300}
              />
            </div>
          ) : null
        ) : (
          <div>
            <QiblaMap fullscreen={true} />
          </div>
        )}
      </div>
    </PageWrapper>
  );
};