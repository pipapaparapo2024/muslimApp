import React, { useEffect, useState } from "react";
import { QiblaMap } from "../QiblaCompass/QiblaMap";
import { QiblaCompass } from "../QiblaCompass/QiblaCompass";
import styles from "./QiblaCompassPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { useQiblaCompassPageStore } from "../../../hooks/useQiblaCompassPageStore";
import { Compass, Map, AlertCircle, Navigation, Info } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useGeoStore } from "../../../hooks/useGeoStore";
import { t } from "i18next";
import { useSensorPermission } from "../../../hooks/useSensorPermission";

export const QiblaCompassPage: React.FC = () => {
  const location = useLocation();
  const { activeTab, setActiveTab } = useQiblaCompassPageStore();
  const { coords, isLoading: geoLoading, error: geoError } = useGeoStore();
  const {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    checkSensorAvailability
  } = useSensorPermission();

  const [isSensorAvailable, setIsSensorAvailable] = useState(false);

  // Проверяем доступность датчиков после получения разрешения
  useEffect(() => {
    if (sensorPermission === "granted") {
      checkSensorAvailability().then(available => {
        setIsSensorAvailable(available);
        console.log(`Датчики ${available ? 'доступны' : 'недоступны'}`);
      });
    }
  }, [sensorPermission, checkSensorAvailability]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state, setActiveTab]);

  const handleRetryPermission = async () => {
    await requestSensorPermission();
  };

  const renderCompassContent = () => {
    if (geoLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>{t("determiningLocation")}</p>
        </div>
      );
    }

    if (geoError) {
      return (
        <div className={styles.errorContainer}>
          <AlertCircle size={32} className={styles.alertIcon} />
          <h3>{t("locationError")}</h3>
          <p>{t("locationRequiredForQibla")}</p>
        </div>
      );
    }

    if (sensorPermission !== "granted") {
      return (
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
                onClick={handleRetryPermission}
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
                onClick={handleRetryPermission}
                className={styles.allowButton}
              >
                {t("allowSensors")}
              </button>
            </div>
          )}
        </div>
      );
    }

    if (!isSensorAvailable) {
      return (
        <div className={styles.permissionOverlay}>
          <div className={styles.permissionMessage}>
            <AlertCircle size={32} className={styles.alertIcon} />
            <h3>{t("sensorsNotAvailable")}</h3>
            <p className={styles.helpText}>
              {t("sensorsNotAvailableHelp")}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <PageWrapper showBackButton title={t("qiblaDirection")}>
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
                permissionGranted={sensorPermission === "granted" && isSensorAvailable}
                coords={coords}
                showAngle={true}
                size={300}
              />
              
              {renderCompassContent()}
            </div>

            {/* Информация о направлении */}
            <div className={styles.directionInfo}>
              <div className={styles.infoCard}>
                <Navigation size={20} />
                <div>
                  <h4>{t("qiblaDirection")}</h4>
                  <p>{t("faceTowardsKaaba")}</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <Info size={20} />
                <div>
                  <h4>{t("usageTips")}</h4>
                  <p>{t("holdPhoneFlat")}</p>
                  <p>{t("avoidMetalObjects")}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.mapSection}>
            <div className={styles.mapContainer}>
              <QiblaMap fullscreen={true} />
            </div>
            <div className={styles.mapInfo}>
              <div className={styles.infoCard}>
                <Map size={20} />
                <div>
                  <h4>{t("mapInstructions")}</h4>
                  <p>{t("mapInstruction")}</p>
                  <p>{t("blueLineShowsDirection")}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};