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

  // Проверяем, iOS ли это устройство
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <PageWrapper>
      <Header />
      
      {/* === КНОПКА ЗАПРОСА ДОСТУПА ТОЛЬКО ДЛЯ iOS === */}
      {isIOS && sensorPermission === "prompt" && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          zIndex: 1000,
          background: 'white',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            Для работы компаса нужен доступ к датчикам
          </p>
          <button
            onClick={requestSensorPermission}
            disabled={isRequestingPermission}
            style={{
              padding: '10px 15px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {isRequestingPermission ? "Запрос..." : "Разрешить доступ"}
          </button>
        </div>
      )}

      {/* Отладочная информация (можно удалить после тестирования) */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        Статус: {sensorPermission}<br/>
        Платформа: {isIOS ? 'iOS' : 'Другая'}
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
                      permissionGranted={sensorPermission === "granted"}
                    />
                  </div>
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