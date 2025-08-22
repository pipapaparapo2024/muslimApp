import React, { useEffect, useState } from "react";
import kaaba from "../../../assets/icons/kaaba.svg";
import sun from "../../../assets/icons/sun_.svg";
import arrow from "../../../assets/icons/navigation-arrow.svg";

const KAABA_COORDS = {
  lat: 21.422487,
  lon: 39.826206,
};

// Базовые размеры для компаса 120px
const BASE_SIZE = 120;
const BASE_ICON_SIZE = 20;
const BASE_ARROW_SIZE = 24;
const BASE_RING_GAP = 20;

// Расширяем интерфейс для iOS свойств
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

interface QiblaCompassProps {
  size?: number;
  showAngle?: boolean;
  permissionGranted?: boolean;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  size = 120,
  showAngle = false,
  permissionGranted = false,
}) => {
  const scale = size / BASE_SIZE;
  const iconSize = Math.round(BASE_ICON_SIZE * scale);
  const arrowSize = Math.round(BASE_ARROW_SIZE * scale);
  const ringGap = Math.round(BASE_RING_GAP * scale);

  const [heading, setHeading] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [isOrientationReady, setIsOrientationReady] = useState(false);
  const [, setIsCalibrated] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [localPermissionGranted, setLocalPermissionGranted] = useState(permissionGranted);

  // Функция для запроса разрешений на датчики
  const requestSensorPermissions = async () => {
    try {
      let granted = false;

      // Запрос разрешения на ориентацию (для iOS)
      const deviceOrientationEvent = DeviceOrientationEvent as any;
      if (deviceOrientationEvent?.requestPermission) {
        try {
          const orientationPermission = await deviceOrientationEvent.requestPermission();
          if (orientationPermission === "granted") {
            granted = true;
          }
        } catch (error) {
          console.warn("Orientation permission denied:", error);
        }
      }

      // Для Android и других браузеров
      if (!deviceOrientationEvent?.requestPermission) {
        granted = true;
      }

      if (granted) {
        setLocalPermissionGranted(true);
        localStorage.setItem("sensorPermissionGranted", "true");
        
        // Устанавливаем обработчик ориентации после получения разрешений
        if (window.DeviceOrientationEvent) {
          window.addEventListener("deviceorientation", handleOrientation, true);
          setIsOrientationReady(true);
        }
      }
    } catch (error) {
      console.error("Error requesting sensor permissions:", error);
    }
  };

  // Автоматический запрос разрешений при монтировании компонента
  useEffect(() => {
    const savedPermission = localStorage.getItem("sensorPermissionGranted");
    if (savedPermission === "true") {
      setLocalPermissionGranted(true);
      
      // Устанавливаем обработчик если разрешения уже есть
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation, true);
        setIsOrientationReady(true);
      }
    } else if (!permissionGranted) {
      // Запрашиваем разрешения если их нет
      requestSensorPermissions();
    }
  }, [permissionGranted]);

  // Получение геолокации
  useEffect(() => {
    let isMounted = true;

    const getLocation = () => {
      const handleLocationSuccess = (latitude: number, longitude: number) => {
        if (isMounted) {
          setCoords({
            lat: latitude,
            lon: longitude,
          });
          setIsLocationReady(true);
        }
      };

      const handleLocationError = (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
        if (isMounted) {
          setIsLocationReady(true);
        }
      };

      if (window.Telegram?.WebApp?.requestLocation) {
        window.Telegram.WebApp.requestLocation(
          (location: { latitude: number; longitude: number } | null) => {
            if (location) {
              handleLocationSuccess(location.latitude, location.longitude);
            } else {
              navigator.geolocation.getCurrentPosition(
                (pos) =>
                  handleLocationSuccess(
                    pos.coords.latitude,
                    pos.coords.longitude
                  ),
                handleLocationError
              );
            }
          }
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            handleLocationSuccess(pos.coords.latitude, pos.coords.longitude),
          handleLocationError
        );
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Обновление времени
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const twelveHourFormat = hours % 12;
      const totalMinutes = twelveHourFormat * 60 + minutes;
      const angle = (totalMinutes / 720) * 360;
      setCurrentTime(angle);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Обработчик ориентации (ИСПРАВЛЕННЫЙ)
  const handleOrientation = (event: DeviceOrientationEvent) => {
    // Приводим к кастомному типу для iOS
    const iosEvent = event as unknown as DeviceOrientationEventiOS;
    
    // Проверяем доступность данных компаса
    const hasStandardCompass = event.alpha !== null;
    const hasWebKitCompass = iosEvent.webkitCompassHeading !== undefined;
    
    if (!hasStandardCompass && !hasWebKitCompass) return;

    let newHeading: number;
    
    // Приоритет для webkitCompassHeading (более точный в iOS)
    if (hasWebKitCompass) {
      newHeading = iosEvent.webkitCompassHeading!;
    } else {
      // Стандартный способ для Android и других устройств
      newHeading = (event.alpha! + 360) % 360;
    }

    setHeading(newHeading);
    setIsCalibrated(true);
  };

  // Расчет направления на Каабу
  const calculateQiblaDirection = () => {
    if (!coords) return 0;

    const userLatRad = (coords.lat * Math.PI) / 180;
    const userLonRad = (coords.lon * Math.PI) / 180;
    const kaabaLatRad = (KAABA_COORDS.lat * Math.PI) / 180;
    const kaabaLonRad = (KAABA_COORDS.lon * Math.PI) / 180;

    const deltaLon = kaabaLonRad - userLonRad;

    const y = Math.sin(deltaLon) * Math.cos(kaabaLatRad);
    const x =
      Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
      Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLon);

    let direction = Math.atan2(y, x) * (180 / Math.PI);
    direction = (direction + 349) % 360;

    return direction;
  };

  const qiblaTrueAngle = calculateQiblaDirection();
  const kaabaRelativeAngle =
    heading !== null ? (qiblaTrueAngle - heading + 360) % 360 : 0;

  // Основные размеры
  const center = size / 2;
  const outerRadius = center - 10;
  const middleRadius = outerRadius - ringGap;

  // Позиция солнца
  const sunAngleRad = ((currentTime - 90) * Math.PI) / 180;
  const sunX = center + middleRadius * Math.cos(sunAngleRad);
  const sunY = center + middleRadius * Math.sin(sunAngleRad);

  // Позиция Каабы - исправлено направление
  const kaabaAngleRad = ((kaabaRelativeAngle - 90) * Math.PI) / 180;
  const kaabaX = center + outerRadius * Math.cos(kaabaAngleRad);
  const kaabaY = center + outerRadius * Math.sin(kaabaAngleRad);

  // Луч света
  const sectorAngle = 30;
  const sectorStartRad = ((-sectorAngle / 2 - 90) * Math.PI) / 180;
  const sectorEndRad = ((sectorAngle / 2 - 90) * Math.PI) / 180;
  const sectorStartX = center + outerRadius * Math.cos(sectorStartRad);
  const sectorStartY = center + outerRadius * Math.sin(sectorStartRad);
  const sectorEndX = center + outerRadius * Math.cos(sectorEndRad);
  const sectorEndY = center + outerRadius * Math.sin(sectorEndRad);
  const sectorPath = `M ${center} ${center} L ${sectorStartX} ${sectorStartY} A ${outerRadius} ${outerRadius} 0 0 1 ${sectorEndX} ${sectorEndY} Z`;

  const isReady = isLocationReady && isOrientationReady && localPermissionGranted;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg
        width={size}
        height={size}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 2,
        }}
      >
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="var(--bg-surface)"
          stroke="#17823a"
          strokeWidth={2 * scale}
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius+2.5}
          fill="var(--bg-surface)"
          stroke="#17823a"
          strokeWidth={2 * scale}
        />
        <path
          d={sectorPath}
          fill="var(--color-background-semantic-dimmed-brand)"
        />
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth={2 * scale}
        />
      </svg>

      {/* Солнце */}
      <div
        style={{
          position: "absolute",
          left: sunX,
          top: sunY,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          zIndex: 3,
        }}
      >
        <img
          src={sun}
          alt="Sun"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* Кааба */}
      <div
        style={{
          position: "absolute",
          left: kaabaX,
          top: kaabaY,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          zIndex: 4,
        }}
      >
        <img
          src={kaaba}
          alt="Kaaba"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* Стрелка */}
      <div
        style={{
          left: center,
          top: center,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24%",
          height: "24%",
          background: "green",
          borderRadius: "50%",
          position: "absolute",
          transform: "translate(-50%, -50%) rotate(0deg)",
          zIndex: 5,
        }}
      >
        <img
          src={arrow}
          alt="Arrow"
          style={{
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
          }}
        />
      </div>

      {/* Отображение угла */}
      {showAngle && isReady && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: size + 40,
            transform: "translateX(-50%)",
            color: "#17823a",
            fontWeight: 600,
            fontSize: "28px",
            textAlign: "center",
            zIndex: 6,
          }}
        >
          {kaabaRelativeAngle.toFixed(1)}°
          <div
            style={{
              color: "#888",
              fontWeight: 400,
              fontSize: "16px",
            }}
          >
            Qibla angle of your location
          </div>
        </div>
      )}
    </div>
  );
};