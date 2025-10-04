import React from "react";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { useGeoStore } from "../../hooks/useGeoStore";
import { QiblaMap } from "./QiblaCompass/QiblaMap";
import { Header } from "../../components/header/Header";
import { useTranslationsStore } from "../../hooks/useTranslations";
import { useHomeLogic } from "./useHomeLogic";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TriangleAlert, X } from "lucide-react";
import { trackButtonClick } from "../../api/analytics";
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
  } = useHomeLogic();
  const { translations } = useTranslationsStore();
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
          <h2> {translations?.initializationError}</h2>
          <p>{initializationError}</p>
          <button
            onClick={() => {
              trackButtonClick("try_again_after_error");
              window.location.reload();
            }}
          >
            {translations?.tryAgain}
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header />
      {isLoading && (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      )}

      {error && <div className={styles.errorContainer}>{error}</div>}

      {!isLoading && !error && (
        <>
          <div className={styles.prayerTimesQiblaContainer}>
            {showVpnWarning && (
              <div className={styles.vpnWarningOverlay}>
                <div className={styles.vpnWarningModal}>
                  <div className={styles.vpnWarningClose}>
                    <X
                      onClick={() => {
                        trackButtonClick("close_vpn_warning");
                        handleCloseVpnWarning();
                      }}
                      size={20}
                    />
                  </div>
                  <div className={styles.vpnWarningText}>
                    <div className={styles.TriangleAlert}>
                      <TriangleAlert
                        strokeWidth={1.5}
                        size={50}
                        color="white"
                        fill="#F59E0B"
                      />
                    </div>
                    {translations?.vpnWarning}
                  </div>
                </div>
              </div>
            )}

            {/* Контент блока с возможным размытием */}
            <div
              className={`${styles.prayerTimesQiblaContent} ${
                showVpnWarning ? styles.blurred : ""
              }`}
            >
              <PrayerTimes />

              <div className={styles.qiblaBlock}>
                <div className={styles.titleFaceKaaba}>
                  {translations?.faceTheKaaba}
                  {sensorPermission === "prompt" ? (
                    <div
                      className={`${styles.permissionButton} ${
                        sensorPermission === "prompt" &&
                        styles.permissionButtonPusle
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        trackButtonClick("request_sensor_permission", {
                          current_status: sensorPermission,
                        });
                        requestSensorPermission && requestSensorPermission();
                      }}
                    >
                      {isRequestingPermission
                        ? translations?.requesting
                        : translations?.allowSensors}
                    </div>
                  ) : (
                    <button
                      className={styles.permissionButton}
                      onClick={() => {
                        // 📊 Аналитика: Кнопка сброса разрешения
                        trackButtonClick("reset_sensor_permission");
                        resetSensorPermission();
                      }}
                    >
                      {translations?.resetPermission}
                    </button>
                  )}
                </div>
                <div className={styles.diskFaceKaaba}>
                  {translations?.useMapForSalah}
                </div>

                <div className={styles.qiblaBlockRow}>
                  <div
                    onClick={() => {
                      trackButtonClick("map_click");
                      handleMapClick();
                    }}
                    className={styles.mapContainer}
                  >
                    <QiblaMap
                      onMapClick={handleMapClick}
                      orientationListenerActive={sensorPermission === "granted"}
                    />
                  </div>

                  <div
                    onClick={() => {
                      trackButtonClick("compass_click", {
                        sensor_permission: sensorPermission,
                      });
                      handleCompassClick(sensorPermission);
                    }}
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
                {translations?.locationMay}
              </div>
            </div>
          </div>

          <MenuBlocks />
        </>
      )}
    </PageWrapper>
  );
};
