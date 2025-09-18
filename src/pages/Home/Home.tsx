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

export const Home: React.FC = () => {
  const {
    sensorPermission,
    requestSensorPermission,
    handleCompassClick,
    handleMapClick,
    isRequestingPermission,
    isIOS // Добавляем проверку на iOS
  } = useHomeLogic();

  const { isLoading, error } = useGeoStore();

  return (
    <PageWrapper>
      <Header />

      {/* Показываем кнопку только на iOS и когда разрешение еще не получено */}
      {isIOS && sensorPermission !== "granted" && (
        <button
          className={styles.allowSensorButton}
          onClick={requestSensorPermission}
          disabled={isRequestingPermission}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '10px 15px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          {isRequestingPermission ? t("requesting") : t("allowSensors")}
        </button>
      )}

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
                    onClick={() => handleCompassClick(sensorPermission)}
                    className={styles.compassContainer}
                  >
                    <QiblaCompass
                      permissionGranted={sensorPermission === "granted"}
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
