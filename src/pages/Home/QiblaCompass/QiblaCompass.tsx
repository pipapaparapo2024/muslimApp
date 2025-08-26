import React, { useEffect, useState } from "react";
import kaaba from "../../../assets/icons/kaaba.svg";
import sun from "../../../assets/icons/sun_.svg";

const KAABA_COORDS = {
  lat: 21.422487,
  lon: 39.826206,
};

// Базовые размеры
const BASE_SIZE = 120;
const BASE_ICON_SIZE = 20;
const BASE_RING_GAP = 20;

interface QiblaCompassProps {
  size?: number;
  showAngle?: boolean;
  permissionGranted: boolean;
  coords?: { lat: number; lon: number } | null;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  size = 120,
  showAngle = false,
  permissionGranted,
  coords: externalCoords,
}) => {
  const scale = size / BASE_SIZE;
  const iconSize = Math.round(BASE_ICON_SIZE * scale);
  const ringGap = Math.round(BASE_RING_GAP * scale);

  const [heading, setHeading] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // --- Подписка на deviceorientation ---
  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const iosEvent = event as unknown as { webkitCompassHeading?: number };
      let newHeading: number | null = null;

      if (iosEvent.webkitCompassHeading !== undefined) {
        newHeading = iosEvent.webkitCompassHeading; // iOS
      } else if (event.alpha !== null) {
        newHeading = (360 - event.alpha) % 360; // Android
      }

      if (newHeading !== null) {
        setHeading(newHeading);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [permissionGranted]);

  // --- Обновление времени (часовая стрелка) ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const angle = ((hours * 60 + minutes) / 720) * 360;
      setCurrentTime(angle);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Расчёт направления на Каабу ---
  const calculateQiblaDirection = () => {
    const userCoords = externalCoords;
    if (!userCoords) return 0;

    const { lat: userLat, lon: userLon } = userCoords;

    const userLatRad = (userLat * Math.PI) / 180;
    const userLonRad = (userLon * Math.PI) / 180;
    const kaabaLatRad = (KAABA_COORDS.lat * Math.PI) / 180;
    const kaabaLonRad = (KAABA_COORDS.lon * Math.PI) / 180;

    const deltaLon = kaabaLonRad - userLonRad;

    const y = Math.sin(deltaLon) * Math.cos(kaabaLatRad);
    const x =
      Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
      Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLon);

    let direction = Math.atan2(y, x) * (180 / Math.PI);
    direction = (direction + 360) % 360;

    return direction;
  };

  const qiblaTrueAngle = calculateQiblaDirection();
  const kaabaRelativeAngle =
    heading !== null ? (qiblaTrueAngle - heading + 360) % 360 : 0;

  // --- Геометрия компаса ---
  const center = size / 2;
  const outerRadius = center - 10;
  const middleRadius = outerRadius - ringGap;

  // Солнце (часовая стрелка)
  const sunAngleRad = ((currentTime - 90) * Math.PI) / 180;
  const sunX = center + middleRadius * Math.cos(sunAngleRad);
  const sunY = center + middleRadius * Math.sin(sunAngleRad);

  // Кааба (относительно направления пользователя)
  const kaabaAngleRad = ((kaabaRelativeAngle - 90) * Math.PI) / 180;
  const kaabaX = center + outerRadius * Math.cos(kaabaAngleRad);
  const kaabaY = center + outerRadius * Math.sin(kaabaAngleRad);

  // Луч света (сектор)
  const sectorAngle = 30;
  const sectorStartRad = ((-sectorAngle / 2 - 90) * Math.PI) / 180;
  const sectorEndRad = ((sectorAngle / 2 - 90) * Math.PI) / 180;
  const sectorStartX = center + outerRadius * Math.cos(sectorStartRad);
  const sectorStartY = center + outerRadius * Math.sin(sectorStartRad);
  const sectorEndX = center + outerRadius * Math.cos(sectorEndRad);
  const sectorEndY = center + outerRadius * Math.sin(sectorEndRad);
  const sectorPath = `M ${center} ${center}
                      L ${sectorStartX} ${sectorStartY}
                      A ${outerRadius} ${outerRadius} 0 0 1 ${sectorEndX} ${sectorEndY}
                      Z`;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        border: "2px solid var(--compass-circle-between)",
        borderRadius: "var(--roundings-medium)",
      }}
    >
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
          r={outerRadius + 2}
          fill="var(--bg-surface)"
          stroke="var(--compass-circle-big)"
          strokeWidth={2 * scale}
        />
        <path d={sectorPath} fill="var(--light-beam)" />
        <circle
          cx={center}
          cy={center}
          r={middleRadius}
          fill="none"
          stroke="var(--compass-circle-between)"
          strokeWidth={2 * scale}
        />
      </svg>

      {/* Солнце */}
      <div
        style={{
          position: "absolute",
          left: sunX,
          top: sunY,
          width: `${iconSize + 10}px`,
          height: `${iconSize + 10}px`,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-surface)",
          borderRadius: "50%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          zIndex: 3,
        }}
      >
        <img src={sun} alt="Sun" style={{ width: "80%", height: "80%" }} />
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
          background: "var(--bg-surface)",
          borderRadius: "50%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          zIndex: 4,
        }}
      >
        <img src={kaaba} alt="Kaaba" style={{ width: "80%", height: "80%" }} />
      </div>

      {/* Центральная стрелка (север) */}
      <div
        style={{
          left: center,
          top: center,
          width: "24%",
          height: "24%",
          background: "var(--compass-circle-small)",
          borderRadius: "50%",
          position: "absolute",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        }}
      >
        <svg width={iconSize - 4} height={iconSize - 4} viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.0006 8.5321L10.3014 5.13375C8.81704 2.16495 8.07482 0.680572 6.89947 0.680587C5.72417 0.680558 4.98197 2.16495 3.49757 5.13374L1.79838 8.53212C0.600328 10.9282 0.00130948 12.1263 0.185183 12.8208C0.360102 13.4816 0.876148 13.9976 1.53687 14.1725C2.23145 14.1725 3.42949 13.7574 5.82558 12.5593C6.2103 12.367 6.40269 12.2708 6.60401 12.2309C6.79909 12.1923 6.99991 12.1923 7.195 12.2309C7.3963 12.2708 7.5887 12.367 7.97339 12.5593C10.3695 13.7574 11.5676 14.3564 12.2621 14.1725C12.9228 13.9976 13.4389 13.4816 13.6138 12.8208C13.7977 12.1263 13.1987 10.9282 12.0006 8.5321Z"
            fill="var(--bg-surface)"
          />
        </svg>
      </div>

      {/* Угол (опционально) */}
      {showAngle && permissionGranted && externalCoords && heading !== null && (
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
          <div style={{ color: "#888", fontWeight: 400, fontSize: "16px" }}>
            Qibla angle of your location
          </div>
        </div>
      )}
    </div>
  );
};