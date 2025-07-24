import React, { useEffect, useState } from 'react';
import styles from './QiblaCompass.module.css';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

interface QiblaCompassProps {
  size?: number;
  showAngle?: boolean;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ size = 180, showAngle = false }) => {
  const [heading, setHeading] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [isOrientationReady, setIsOrientationReady] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Получение геолокации
  useEffect(() => {
    let isMounted = true;

    const getLocation = () => {
      const handleLocationSuccess = (latitude: number, longitude: number) => {
        if (isMounted) {
          setCoords({
            lat: latitude,
            lon: longitude
          });
          setIsLocationReady(true);
        }
      };

      const handleLocationError = (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        if (isMounted) {
          setIsLocationReady(true);
        }
      };

      if (window.Telegram?.WebApp?.requestLocation) {
        window.Telegram.WebApp.requestLocation((location: { latitude: number; longitude: number } | null) => {
          if (location) {
            handleLocationSuccess(location.latitude, location.longitude);
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => handleLocationSuccess(pos.coords.latitude, pos.coords.longitude),
              handleLocationError
            );
          }
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => handleLocationSuccess(pos.coords.latitude, pos.coords.longitude),
          handleLocationError
        );
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Запрос разрешения на ориентацию
  useEffect(() => {
    const requestOrientationPermission = async () => {
      try {
        // @ts-ignore
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          // @ts-ignore
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            setPermissionRequested(true);
          }
        } else {
          // Для устройств, где не нужно запрашивать разрешение
          setPermissionRequested(true);
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        setPermissionRequested(true);
      }
    };

    requestOrientationPermission();
  }, []);

  // Установка слушателя ориентации после получения разрешения
  useEffect(() => {
    if (!permissionRequested) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setHeading(event.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    setIsOrientationReady(true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permissionRequested]);

  // Расчет направления на Каабу
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

  const qiblaTrueAngle = calculateQiblaDirection();
  const qiblaDisplayAngle = heading !== null ? (qiblaTrueAngle - heading + 360) % 360 : 0;

  // Размеры
  const center = size / 2;
  const radius = center - 10;
  const kaabaRadius = radius;
  const sunRadius = radius - 40;

  // Позиция солнца (фиксированная относительно времени)
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const sunAngle = ((hour % 12) / 12) * 360;
  const sunAngleRad = ((sunAngle - 90) * Math.PI) / 180;
  const sunX = center + sunRadius * Math.cos(sunAngleRad);
  const sunY = center + sunRadius * Math.sin(sunAngleRad);

  // Проверяем готовность всех данных
  const isReady = isLocationReady && isOrientationReady;

  // Угол вращения внешнего круга
  const rotationAngle = heading !== null ? -heading : 0;

  // Расчет позиций для сектора и Каабы (относительно внешнего круга)
  const sectorAngle = 30;
  const sectorStartRad = ((qiblaTrueAngle - sectorAngle / 2 - 90) * Math.PI) / 180;
  const sectorEndRad = ((qiblaTrueAngle + sectorAngle / 2 - 90) * Math.PI) / 180;
  const sectorStartX = center + radius * Math.cos(sectorStartRad);
  const sectorStartY = center + radius * Math.sin(sectorStartRad);
  const sectorEndX = center + radius * Math.cos(sectorEndRad);
  const sectorEndY = center + radius * Math.sin(sectorEndRad);
  const sectorPath = `M ${center} ${center} L ${sectorStartX} ${sectorStartY} A ${radius} ${radius} 0 0 1 ${sectorEndX} ${sectorEndY} Z`;

  // Позиция Каабы (на внешнем круге)
  const kaabaAngleRad = ((qiblaTrueAngle - 90) * Math.PI) / 180;
  const kaabaX = center + kaabaRadius * Math.cos(kaabaAngleRad);
  const kaabaY = center + kaabaRadius * Math.sin(kaabaAngleRad);

  return (
    <div
      className={styles.compassWrapper}
      style={{ width: size, height: size, position: 'relative' }}
    >
      {/* Внешний круг - вращается */}
      <div
        style={{
          width: size,
          height: size,
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `rotate(${rotationAngle}deg)`,
          transformOrigin: 'center center',
          transition: 'none'
        }}
      >
        {/* SVG с кругами, сектором и Каабой */}
        <svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
          <circle cx={center} cy={center} r={radius} fill="#fff" stroke="#17823a" strokeWidth="3" />
          <circle cx={center} cy={center} r={sunRadius} fill="none" stroke="#e5e5e5" strokeWidth="2" />
          {/* Сектор (луч света) - на внешнем круге */}
          {isReady && <path d={sectorPath} fill="#17823a22" />}
          {/* Кааба - на внешнем круге */}
          {isReady && (
            <foreignObject
              x={kaabaX - size * 0.065}
              y={kaabaY - size * 0.08}
              width={size * 0.13}
              height={size * 0.13}
            >
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                borderRadius: '50%',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                fontSize: size * 0.09
              }}>
                <span>🕋</span>
              </div>
            </foreignObject>
          )}
        </svg>
      </div>

      {/* Солнце - фиксированное на среднем круге */}
      <div
        style={{
          position: 'absolute',
          left: sunX,
          top: sunY,
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.11,
          background: '#fff',
          borderRadius: '50%',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          border: 'none',
          padding: 0,
          zIndex: 2
        }}
      >
        <span style={{ fontSize: size * 0.11, lineHeight: 1 }}>☀️</span>
      </div>

      {/* Стрелка - всегда по центру */}
      <div
        style={{
          left: center,
          top: center,
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          zIndex: 4
        }}
      >
        <svg
          width={size * 0.22}
          height={size * 0.22}
          viewBox="0 0 44 44"
        >
          <circle cx="22" cy="22" r="20" fill="#17823a" />
          <polygon points="22,12 28,32 22,26 16,32" fill="#fff" />
        </svg>
      </div>

      {/* Угол */}
      {showAngle && isReady && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: size + 40,
          transform: 'translateX(-50%)',
          color: '#17823a',
          fontWeight: 700,
          fontSize: 28,
          textAlign: 'center'
        }}>
          {qiblaDisplayAngle.toFixed(1)}
          <div style={{ color: '#888', fontWeight: 400, fontSize: 16 }}>Qibla angle</div>
        </div>
      )}

      {/* Индикатор загрузки */}
      {!isReady && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 5
        }}>
        </div>
      )}
    </div>
  );
};