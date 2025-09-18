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
  } = useHomeLogic();

  const { isLoading, error } = useGeoStore();

  return (
    <PageWrapper>
      <Header />

      {/* Кнопка запроса доступа к датчикам - показываем только если разрешение еще не получено */}
      {sensorPermission !== "granted" && (
        <button
          className={styles.allowSensorButton}
          onClick={() => requestSensorPermission()}
          disabled={isRequestingPermission}
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
                    onClick={handleCompassClick}
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