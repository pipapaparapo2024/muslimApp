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
import { TriangleAlert, X } from "lucide-react";

export const Home: React.FC = () => {
  const {
    sensorPermission,
    requestSensorPermission,
    resetSensorPermission,
    handleCompassClick,
    handleMapClick,
    isRequestingPermission,
    isInitializing,
    initializationError,
    showVpnWarning,
    handleCloseVpnWarning,
    handleOpenVpnWarning,
  } = useHomeLogic();

  const { isLoading, error } = useGeoStore();
  
  if (isInitializing) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }
  
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
      <button onClick={() => handleOpenVpnWarning()}>open VPN</button>
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
              {/* Модальное окно с предупреждением о VPN - ТЕПЕРЬ ВНУТРИ КОНТЕЙНЕРА */}
              {showVpnWarning && (
                <div className={styles.vpnWarningOverlay}>
                  <div className={styles.vpnWarningModal}>
                    <button
                      className={styles.vpnWarningClose}
                      onClick={handleCloseVpnWarning}
                      aria-label={t("close")}
                    >
                      <X size={20} />
                    </button>
                    <div className={styles.vpnWarningText}>
                      <TriangleAlert size={40} color="var(--warning-color)" />
                      {t("vpnWarning")}
                    </div>
                  </div>
                </div>
              )}

              {/* Контент блока с возможным размытием */}
              <div className={`${styles.prayerTimesQiblaContent} ${showVpnWarning ? styles.blurred : ""}`}>
                <PrayerTimes />

                <div className={styles.qiblaBlock}>
                  <div className={styles.titleFaceKaaba}>
                    {t("faceTheKaaba")}{" "}
                    {sensorPermission === "prompt" ? (
                      <div
                        className={`${styles.permissionButton} ${
                          sensorPermission === "prompt" &&
                          styles.permissionButtonPusle
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          requestSensorPermission && requestSensorPermission();
                        }}
                      >
                        {isRequestingPermission
                          ? t("requesting...")
                          : t("allowSensors")}
                      </div>
                    ) : (
                      <button
                        className={styles.permissionButton}
                        onClick={resetSensorPermission}
                      >
                        {t("resetPermission")}
                      </button>
                    )}
                  </div>
                  <div className={styles.diskFaceKaaba}>
                    {t("useMapForSalah")}
                  </div>

                  <div className={styles.qiblaBlockRow}>
                    <div onClick={handleMapClick} className={styles.mapContainer}>
                      <QiblaMap
                        onMapClick={handleMapClick}
                        orientationListenerActive={sensorPermission === "granted"}
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
                <div className={styles.locationMay}>
                  <TriangleAlert
                    strokeWidth={1.5}
                    size={18}
                    color="white"
                    fill="#F59E0B"
                  />
                  {t("locationMay")}{" "}
                </div>
              </div>
            </div>

            <MenuBlocks />
          </>
        )}
      </div>
    </PageWrapper>
  );
};