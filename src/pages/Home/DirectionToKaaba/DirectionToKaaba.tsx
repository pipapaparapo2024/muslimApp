import React, { useEffect, useState, useRef } from 'react';
import styles from './DirectionToKaaba.module.css';

// Координаты Каабы
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

declare global {
  interface Window {
    Telegram?: any;
  }
}

export const DirectionToKaaba: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [deviceAlpha, setDeviceAlpha] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const compassRef = useRef<HTMLDivElement>(null);

  // Получаем координаты через Telegram API или браузер
  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      window.Telegram.WebApp.requestLocation((location: { latitude: number; longitude: number } | null) => {
        if (location) {
          setCoords({
            lat: location.latitude,
            lon: location.longitude
          });
        } else {
          setError("Location access denied");
        }
      });
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        }),
        () => setError("Geolocation not available")
      );
    }
  }, []);

  // Запрашиваем доступ к датчикам (особенно для iOS)
  const requestPermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
        } else {
          setError("Compass permission denied");
        }
      } else {
        setPermissionGranted(true);
      }
    } catch (e) {
      setError("Permission request failed");
    }
  };

  // Подписываемся на данные компаса
  useEffect(() => {
    if (!permissionGranted) return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setDeviceAlpha(e.alpha);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionGranted]);

  // Расчёт направления на Каабу
  const calculateQiblaDirection = () => {
    if (!coords || deviceAlpha === null) return 0;
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const toDeg = (rad: number) => rad * (180 / Math.PI);
    const phiK = toRad(KAABA_LAT);
    const lambdaK = toRad(KAABA_LON);
    const phi = toRad(coords.lat);
    const lambda = toRad(coords.lon);
    const y = Math.sin(lambdaK - lambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    let theta = Math.atan2(y, x);
    theta = toDeg(theta);
    // Корректировка с учётом ориентации устройства
    return (360 - deviceAlpha + theta + 360) % 360;
  };

  const angle = calculateQiblaDirection();

  // Карта
  let mapContent: React.ReactNode = null;
  if (coords) {
    const lat = coords.lat;
    const lon = coords.lon;
    const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=150,100&z=13&l=map&pt=${lon},${lat},pm2rdm`;
    mapContent = (
      <div className={styles.mapContainer}>
        <img src={mapUrl} alt="Map" className={styles.mapImage} />
      </div>
    );
  }

  // Компас
  let compassContent = null;
  if (permissionGranted) {
    compassContent = (
      <div ref={compassRef} className={styles.compass}>
        {/* Компас окружность */}
        <div className={styles.compassCircle}></div>
        {/* Стрелка */}
        <div
          className={styles.arrow}
          style={{ transform: `translate(0, -50%) rotate(${angle}deg)` }}
        ></div>
        {/* Иконка Каабы */}
        <div className={styles.kaabaIcon}>🕋</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Face the Kaaba</div>
      <div className={styles.subtitle}>
        Use the map to align yourself correctly for Salah.
      </div>
      <div className={styles.row}>
        {mapContent}
        {!permissionGranted ? (
          <button 
            onClick={requestPermission}
            className={styles.compassButton}
          >
            Enable Compass
          </button>
        ) : (
          compassContent
        )}
      </div>
      {coords && (
        <div className={styles.location}>
          Your location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
        </div>
      )}
      {error && (
        <div className={styles.error}>{error}</div>
      )}
    </div>
  );
}; 