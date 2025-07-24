import React, { useEffect, useState } from 'react';
import styles from './QiblaMap.module.css';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

export const QiblaMap: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    const getLocation = () => {
      if (window.Telegram?.WebApp?.requestLocation) {
        window.Telegram.WebApp.requestLocation((location: { latitude: number; longitude: number } | null) => {
          if (location) {
            setCoords({
              lat: location.latitude,
              lon: location.longitude
            });
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => setCoords({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
              })
            );
          }
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          })
        );
      }
    };
    getLocation();
  }, []);

  // Qibla direction
  const calculateQiblaDirection = () => {
    if (!coords) return 0;
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
    return theta;
  };

  let mapContent = null;
  if (coords) {
    const lat = coords.lat;
    const lon = coords.lon;
    const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=240,140&z=9&l=map`;
    const theta = calculateQiblaDirection();
    mapContent = (
      <div className={styles.mapContainer}>
        <img src={mapUrl} alt="Map" className={styles.mapImage} />
        {/* Стрелка по центру */}
        <div className={styles.arrowContainer}>
          <svg width="32" height="32" viewBox="0 0 44 44" style={{ transform: `rotate(${theta}deg)` }}>
            <circle cx="22" cy="22" r="20" fill="#17823a" />
            <polygon points="22,12 28,32 22,26 16,32" fill="#fff" />
          </svg>
        </div>
      </div>
    );
  }
  return mapContent;
}; 