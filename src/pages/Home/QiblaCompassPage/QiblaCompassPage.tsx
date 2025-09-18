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

// Проверяем, является ли устройство iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  const { coords } = useGeoStore();
  const [sensorPermission, setSensorPermission] = useState<string>("prompt");

  // Загружаем статус разрешения при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("sensorPermissionStatus");
    setSensorPermission(saved || "prompt");
  }, []);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state, setActiveTab]);

  // Если на вкладке компаса и нет разрешения на iOS, показываем сообщение
  const showPermissionMessage = activeTab === "compass" && 
                               isIOS() && 
                               sensorPermission !== "granted";

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

      {showPermissionMessage && (
        <div className={styles.permissionMessage}>
          <p>{t("sensorPermissionRequired")}</p>
          <button 
            onClick={() => window.history.back()}
            className={styles.permissionButton}
          >
            {t("goBackToRequest")}
          </button>
        </div>
      )}

      <div className={styles.tabContent}>
        {activeTab === "compass" ? (
          <div className={styles.bigCompass}>
            <QiblaCompass
              permissionGranted={sensorPermission === "granted"}
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