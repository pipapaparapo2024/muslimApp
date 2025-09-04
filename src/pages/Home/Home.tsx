import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
import { QiblaMap } from "./QiblaCompass/QiblaMap";
import { Header } from "../../components/header/Header";
import { useUserParametersStore } from "../../hooks/useUserParametrsStore";
import { useGeoStore } from "../../hooks/useGeoStore";
import { t } from "i18next";

// Ключи для localStorage
const GEO_PERMISSION_STATUS = "geoPermissionStatus";
const SENSOR_PERMISSION_STATUS = "sensorPermissionStatus";
const CACHED_LOCATION = "cachedLocation";
const IP_DATA_CACHE = "ipDataCache";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { settingsSent, sendUserSettings } = useUserParametersStore();

  // Используем стор для геоданных
  const {
    langcode,
    coords,
    city,
    country,
    timeZone,
    isLoading,
    error,
    fetchFromIpApi,
    setCoords,
    setCity,
    setCountry,
    setTimeZone,
    setError,
    setHasRequestedGeo,
  } = useGeoStore();

  const [sensorPermission, setSensorPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "unknown"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false); // Модальное окно

  const geoRequested = useRef(false);
  const sensorRequested = useRef(false);
  const ipDataFetched = useRef(false);
  const settingsSentRef = useRef(settingsSent);

  // Обновляем ref при изменении settingsSent
  useEffect(() => {
    settingsSentRef.current = settingsSent;
  }, [settingsSent]);

  // Функция для получения данных из кэша
  const getCachedIpData = () => {
    try {
      const cached = localStorage.getItem(IP_DATA_CACHE);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 2 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached IP data", e);
    }
    return null;
  };

  // Функция для отправки настроек местоположения
  const sendLocationSettings = useCallback(async () => {
    if (city && country && timeZone && city !== "Unknown" && country !== "Unknown") {
      console.log("Отправляем настройки местоположения:", { city, country, langcode, timeZone });

      const settingsData = { city, country, langcode, timeZone };

      try {
        await sendUserSettings(settingsData);
        console.log("Настройки успешно отправлены на сервер");
      } catch (error) {
        console.error("Ошибка при отправке настроек:", error);
      }
    } else {
      console.log("Не все данные готовы для отправки:", { city, country, timeZone });
    }
  }, [city, country, timeZone, langcode, sendUserSettings]);

  // Отслеживаем изменения геоданных и отправляем настройки
  useEffect(() => {
    sendLocationSettings();
  }, [sendLocationSettings]);

  // Функция для сброса и обновления данных геолокации
  const handleRefreshLocationData = async () => {
    setIsRefreshing(true);

    localStorage.removeItem(IP_DATA_CACHE);
    localStorage.removeItem(CACHED_LOCATION);

    setCoords(null);
    setCity(null);
    setCountry(null);
    setTimeZone(null);
    setError(null);

    ipDataFetched.current = false;
    geoRequested.current = false;

    try {
      await fetchFromIpApi();
      ipDataFetched.current = true;

      const geoStatus = localStorage.getItem(GEO_PERMISSION_STATUS);
      if (geoStatus === "granted") {
        await requestGeolocation();
      }
    } catch (error) {
      console.error("Failed to refresh location data:", error);
      setError("Не удалось обновить данные местоположения");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Функция для запроса геолокации
  const requestGeolocation = async () => {
    geoRequested.current = true;
    setHasRequestedGeo(true);

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          const locationData = { lat, lon, timestamp: Date.now() };

          localStorage.setItem(CACHED_LOCATION, JSON.stringify(locationData));
          localStorage.setItem(GEO_PERMISSION_STATUS, "granted");

          setCoords({ lat, lon });

          const cachedIpData = getCachedIpData();
          if (cachedIpData) {
            setCity(cachedIpData.city || "Unknown");
            setCountry(cachedIpData.country || "Unknown");
            setTimeZone(cachedIpData.timeZone || null);
          } else if (!ipDataFetched.current) {
            try {
              await fetchFromIpApi();
              ipDataFetched.current = true;
            } catch (_) {
              setCity("Unknown");
              setCountry("Unknown");
              setTimeZone(null);
            }
          }

          resolve();
        },
        async (err) => {
          console.warn("Geolocation error:", err);
          localStorage.setItem(GEO_PERMISSION_STATUS, "denied");

          const cachedIpData = getCachedIpData();
          if (cachedIpData) {
            setCoords(cachedIpData.coords);
            setCity(cachedIpData.city || "Unknown");
            setCountry(cachedIpData.country || "Unknown");
            setTimeZone(cachedIpData.timeZone || null);
          } else if (!ipDataFetched.current) {
            try {
              await fetchFromIpApi();
              ipDataFetched.current = true;
            } catch (_) {
              setError("Не удалось определить местоположение");
              setCity("Unknown");
              setCountry("Unknown");
              setTimeZone(null);
            }
          }

          resolve();
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  // Проверяем статус датчиков при загрузке
  useEffect(() => {
    if (sensorRequested.current) return;

    const status = localStorage.getItem(SENSOR_PERMISSION_STATUS);

    if (status === "granted") {
      setSensorPermission("granted");
    } else if (status === "denied") {
      setSensorPermission("denied");
    } else if (status === "unsupported") {
      setSensorPermission("unsupported");
    } else {
      // Показываем модальное окно, если статус неизвестен
      setShowSensorModal(true);
    }

    sensorRequested.current = true;
  }, []);

  // Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.MainButton.hide();
      tg.BackButton.hide();
      tg.enableClosingConfirmation();
    }
  }, []);

  const handleCompassClick = () => {
    // Если разрешение ещё не получено — показываем модальное окно
    if (sensorPermission !== "granted" && sensorPermission !== "denied") {
      setShowSensorModal(true);
    } else if (sensorPermission === "granted") {
      navigate("/qibla", { state: { activeTab: "compass" } });
    }
  };

  const handleMapClick = () =>
    navigate("/qibla", { state: { activeTab: "map" } });

  // Инициализация геолокации
  useEffect(() => {
    if (geoRequested.current) return;

    const initializeLocation = async () => {
      geoRequested.current = true;

      const status = localStorage.getItem(GEO_PERMISSION_STATUS);
      const cached = localStorage.getItem(CACHED_LOCATION);

      if (cached) {
        try {
          const data = JSON.parse(cached);
          const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
          if (isFresh && data.lat && data.lon) {
            setCoords({ lat: data.lat, lon: data.lon });

            if (!ipDataFetched.current) {
              try {
                await fetchFromIpApi();
                ipDataFetched.current = true;
              } catch (_) {
                setCity("Unknown");
                setCountry("Unknown");
                setTimeZone(null);
              }
            }
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached location", e);
        }
      }

      if (!status || status === "unknown") {
        await requestGeolocation();
      } else if (status === "granted") {
        await requestGeolocation();
      } else if (status === "denied") {
        if (!ipDataFetched.current) {
          try {
            await fetchFromIpApi();
            ipDataFetched.current = true;
          } catch (_) {
            setError("Не удалось определить местоположение");
          }
        }
      }
    };

    initializeLocation();
  }, [settingsSent]);

  return (
    <PageWrapper>
      <Header
        city={city || "Unknown city"}
        country={country || "Unknown country"}
      />
      ываываываываа
      <div className={styles.homeRoot}>
        {/* Кнопка обновления */}
        <div className={styles.refreshButtonContainer}>
          <button
            className={styles.refreshLocationButton}
            onClick={handleRefreshLocationData}
            disabled={isRefreshing}
            title="Обновить данные местоположения"
          >
            {isRefreshing ? (
              <span>Обновление...</span>
            ) : (
              <span>🔄 Обновить местоположение</span>
            )}
          </button>
        </div>

        {isLoading && (
          <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            Определяем ваше местоположение...
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", textAlign: "center", color: "red" }}>
            {error}
          </div>
        )}

        {/* Основной контент */}
        <div className={styles.prayerTimesQiblaContainer}>
          <PrayerTimes />
          <div className={styles.qiblaBlock}>
            <div className={styles.titleFaceKaaba}>{t("faceTheKaaba")}</div>
            <div className={styles.diskFaceKaaba}>{t("useMapForSalah")}</div>
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
                  coords={coords}
                />
                {/* Подсказка, если нужно взаимодействие */}
                {sensorPermission === "prompt" && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#666",
                      background: "rgba(255, 255, 255, 0.9)",
                      padding: "8px",
                      borderRadius: "8px",
                    }}
                  >
                    Нажмите для доступа к датчикам
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <MenuBlocks />
      </div>

      {/* Модальное окно для запроса доступа к датчикам */}
      {showSensorModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{t("enableSensors")}</h3>
            <p>{t("compassNeedsAccess")}</p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButton}
                onClick={async () => {
                  try {
                    const result = await (
                      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
                    ).requestPermission?.();

                    const permission = result === "granted" ? "granted" : "denied";
                    setSensorPermission(permission);
                    localStorage.setItem(SENSOR_PERMISSION_STATUS, permission);

                    if (permission === "granted") {
                      console.log("✅ Доступ к датчикам разрешён");
                    }
                  } catch (err) {
                    console.error("Ошибка запроса разрешения:", err);
                    setSensorPermission("granted");
                    localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
                  } finally {
                    setShowSensorModal(false);
                  }
                }}
              >
                {t("allow")}
              </button>
              <button
                className={styles.modalButtonSecondary}
                onClick={() => {
                  setSensorPermission("denied");
                  localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
                  setShowSensorModal(false);
                }}
              >
                {t("deny")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};