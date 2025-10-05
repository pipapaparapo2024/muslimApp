import React, { useEffect } from "react";
import { QiblaMap } from "../QiblaCompass/QiblaMap";
import { QiblaCompass } from "../QiblaCompass/QiblaCompass";
import styles from "./QiblaCompassPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useQiblaCompassPageStore } from "../../../hooks/useQiblaCompassPageStore";
import { Compass, Map } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useGeoStore } from "../../../hooks/useGeoStore";
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus"; // granted/denied
import { useTranslationsStore } from "../../../hooks/useTranslations";
export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  const { coords } = useGeoStore();
  const { translations } = useTranslationsStore();
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state, setActiveTab]);
  useEffect(() => {
    if (
      activeTab === "compass" &&
      localStorage.getItem(SENSOR_PERMISSION_STATUS) === "prompt"
    ) {
      // Можно показать кнопку или сообщение о необходимости запроса разрешения
      console.log("Need to request sensor permission");
    }
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
            <Compass size={16} strokeWidth={1.5} /> {translations?.compass}
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
            <Map size={16} strokeWidth={1.5} /> {translations?.map}
          </span>
        </label>
      </div>

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
