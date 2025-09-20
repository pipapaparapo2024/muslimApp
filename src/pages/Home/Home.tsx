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
    resetSensorPermission, // Добавляем функцию сброса
    handleCompassClick,
    handleMapClick,
    isRequestingPermission,
    isInitializing,
    initializationError,
  } = useHomeLogic();

  const { isLoading, error } = useGeoStore();

  // Показываем лоадер во время инициализации
  if (isInitializing) {
    return (
      <PageWrapper>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>{t("initializingApp")}</p>
        </div>
      </PageWrapper>
    );
  }

  // Показываем ошибку инициализации
  if (initializationError) {
    return (
      <PageWrapper>
        <div className={styles.errorContainer}>
          <h2>{t("initializationError")}</h2>
          <p>{initializationError}</p>
          <button onClick={() => window.location.reload()}>
            {t("tryAgain")}
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header />

      {/* Кнопка сброса разрешения (только для отладки) */}
      {sensorPermission === "granted" && (
        <button 
          className={styles.resetPermissionButton}
          onClick={resetSensorPermission}
          title={t("resetPermissionHint")}
        >
          {t("resetPermission")}
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
                    <QiblaMap 
                      onMapClick={handleMapClick} 
                      showPermissionButton={sensorPermission !== "granted"}
                      onRequestPermission={requestSensorPermission}
                      isRequestingPermission={isRequestingPermission}
                    />
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