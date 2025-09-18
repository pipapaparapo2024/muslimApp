import React from "react";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { useGeoStore } from "../../hooks/useGeoStore";
import { QiblaMap } from "./QiblaCompass/QiblaMap";
import { Header } from "../../components/header/Header";
import { t } from "i18next";
import { useHomeLogic } from "./useHomeLogic";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { AlertCircle, CheckCircle } from "lucide-react";

export const Home: React.FC = () => {
  const {
    sensorPermission,
    isRequestingPermission,
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
    isSensorAvailable,
  } = useHomeLogic();

  const { isLoading, error } = useGeoStore();

  return (
    <PageWrapper>
      <Header />

      {/* Всегда показываем кнопку разрешения, даже если уже granted */}
      <div className={styles.sensorPermissionContainer}>
        {sensorPermission !== "granted" ? (
          <>
            <button
              className={styles.allowSensorButton}
              onClick={requestSensorPermission}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? t("requesting") : t("allowSensors")}
            </button>
            <p className={styles.sensorPermissionText}>
              {t("sensorPermissionDescription")}
            </p>
          </>
        ) : !isSensorAvailable ? (
          <div className={styles.sensorWarning}>
            <AlertCircle size={20} />
            <span>{t("sensorsNotAvailableHelp")}</span>
          </div>
        ) : (
          <button
            className={styles.sensorEnabledButton}
            onClick={requestSensorPermission}
          >
            <CheckCircle size={20} />
            <span>{t("sensorsEnabled")}</span>
          </button>
        )}
      </div>

      <div className={styles.homeRoot}>
        {isLoading && (
          <div className={styles.loadingContainer}>
            <LoadingSpinner />
          </div>
        )}

        {error && <div className={styles.errorContainer}>{error}</div>}

        {!isLoading && !error && (
          <>
            <div className={styles.prayerTimesQiblaContainer}>
              <PrayerTimes />

              <div className={styles.qiblaBlock}>
                <div className={styles.titleFaceKaaba}>{t("faceTheKaaba")}</div>
                <div className={styles.diskFaceKaaba}>
                  {t("useMapForSalah")}
                </div>

                <div className={styles.qiblaBlockRow}>
                  <div onClick={handleMapClick} className={styles.mapContainer}>
                    <QiblaMap onMapClick={handleMapClick} />
                  </div>

                  <div
                    onClick={handleCompassClick}
                    className={styles.compassContainer}
                  >
                    <QiblaCompass
                      permissionGranted={
                        sensorPermission === "granted" && isSensorAvailable
                      }
                    />
                  </div>
                </div>
              </div>
              <div className={styles.locationMay}>{t("locationMay")}</div>
            </div>

            <MenuBlocks />
          </>
        )}
      </div>
    </PageWrapper>
  );
};