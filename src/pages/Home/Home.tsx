import React, { useEffect, useRef, useState } from "react";
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

  // Геоданные из стора
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
  localStorage.removeItem("sensorPermissionStatus");
  const [sensorPermission, setSensorPermission] = useState<string>(
    localStorage.getItem(SENSOR_PERMISSION_STATUS) || "prompt"
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const geoRequested = useRef(false);
  const settingsSentRef = useRef(settingsSent);
  const ipDataFetched = useRef(false);

  // Обновляем ref при изменении settingsSent
  useEffect(() => {
    settingsSentRef.current = settingsSent;
  }, [settingsSent]);

  // === ФУНКЦИЯ ОТПРАВКИ НАСТРОЕК ===
  const sendLocationSettings = async () => {
    if (
      city &&
      country &&
      timeZone &&
      city !== "Unknown" &&
      country !== "Unknown"
    ) {
      console.log("Отправляем настройки местоположения:", {
        city,
        country,
        langcode,
        timeZone,
      });

      try {
        await sendUserSettings({ city, country, langcode, timeZone });
        console.log("Настройки успешно отправлены");
      } catch (error) {
        console.error("Ошибка при отправке настроек:", error);
      }
    }
  };

  // Отправка при изменении данных
  useEffect(() => {
    sendLocationSettings();
  }, [city, country, timeZone, sendUserSettings]);

  // === ОБНОВЛЕНИЕ ГЕОЛОКАЦИИ ===
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

  // === ГЕОЛОКАЦИЯ ===
  const requestGeolocation = async () => {
    geoRequested.current = true;
    setHasRequestedGeo(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
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
          fetchFromIpApi()
            .then(() => (ipDataFetched.current = true))
            .catch(() => {
              setCity("Unknown");
              setCountry("Unknown");
              setTimeZone(null);
            });
        }
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
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // === КЭШ IP ===
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

  // === ИНИЦИАЛИЗАЦИЯ ГЕОДАННЫХ ===
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

  // === ЗАПРОС ДОСТУПА К ДАТЧИКАМ ЧЕРЕЗ КНОПКУ ===
  const requestSensorPermission = async () => {
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        // iOS: явный запрос
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        localStorage.setItem(SENSOR_PERMISSION_STATUS, result);
        setSensorPermission(result);
      } else {
        // Android и другие: просто пытаемся использовать
        window.addEventListener("deviceorientation", () => {}, { once: true });
        localStorage.setItem(SENSOR_PERMISSION_STATUS, "granted");
        setSensorPermission("granted");
      }
    } catch (err) {
      console.error("Sensor permission error:", err);
      localStorage.setItem(SENSOR_PERMISSION_STATUS, "denied");
      setSensorPermission("denied");
    }
  };

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
    navigate("/qibla", { state: { activeTab: "compass" } });
  };

  const handleMapClick = () =>
    navigate("/qibla", { state: { activeTab: "map" } });

  return (
    <PageWrapper>
      <Header
        city={city || "Unknown city"}
        country={country || "Unknown country"}
      />

      {/* === ЕДИНСТВЕННАЯ КНОПКА ЗАПРОСА ДОСТУПА К ДАТЧИКАМ (под Header) === */}
      {sensorPermission !== "granted" && (
        <div className={styles.sensorPermissionPrompt}>
          <div className={styles.sensorPermissionCard}>
            <div className={styles.sensorIcon}>🧭</div>
            <h3>{t("enableDeviceSensors")}</h3>
            <p>{t("compassAndQiblaNeedAccess")}</p>
            <button
              className={styles.allowSensorButton}
              onClick={requestSensorPermission}
            >
              {t("allowAccess")}
            </button>
          </div>
        </div>
      )}

      {/* === ОСНОВНОЙ КОНТЕНТ === */}
      <div className={styles.homeRoot}>
        {/* Кнопка обновления местоположения */}
        <div className={styles.refreshButtonContainer}>
          <button
            className={styles.refreshLocationButton}
            onClick={handleRefreshLocationData}
            disabled={isRefreshing}
            title={t("refreshLocation")}
          >
            {isRefreshing ? t("updating") : "🔄 " + t("refreshLocation")}
          </button>
        </div>

        {isLoading && (
          <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
            {t("detectingLocation")}...
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", textAlign: "center", color: "red" }}>
            {error}
          </div>
        )}

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
                {sensorPermission === "granted" ? (
                  <QiblaCompass permissionGranted={true} coords={coords} />
                ) : (
                  <div className={styles.permissionPrompt}>
                    <p>{t("compassNeedsAccess")}</p>
                    <button
                      className={styles.permissionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        requestSensorPermission();
                      }}
                    >
                      {t("allow")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <MenuBlocks />
      </div>
    </PageWrapper>
  );
};
