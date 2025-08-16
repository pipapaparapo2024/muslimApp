// src/components/QiblaCompass.tsx
import React, { useEffect, useState, useRef } from "react";
import styles from "./QiblaCompass.module.css";
import { useGeoStore } from "../GeoStore";
import { ArrowUp } from "lucide-react";
import arrowUp from '../../../assets/icons/navigationArrowMaps.svg'
import kaaba from '../../../assets/icons/kaaba.svg'

const KAABA_COORDS = {
  lat: 21.422487,
  lon: 39.826206
};

export const QiblaCompass: React.FC = () => {
  const { coords } = useGeoStore();
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const orientationHandler = useRef<(event: DeviceOrientationEvent) => void>();

  // Calculate Qibla direction
  useEffect(() => {
    if (!coords) {
      console.log("Coordinates not available");
      return;
    }

    console.log("Calculating Qibla direction for coords:", coords);
    const calculateDirection = () => {
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
      direction = (direction + 360) % 360;

      console.log("Calculated Qibla direction:", direction);
      setQiblaDirection(direction);
    };

    calculateDirection();
  }, [coords]);

  // Handle device orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      console.log("Orientation event:", event);
      
      if (event.alpha === null && event.webkitCompassHeading === undefined) {
        console.log("No orientation data available");
        return;
      }

      let newHeading;
      
      // iOS with compass heading
      if (event.webkitCompassHeading !== undefined) {
        newHeading = event.webkitCompassHeading;
      } 
      // Android and others
      else {
        newHeading = (event.alpha + 360) % 360;
      }

      console.log("New heading:", newHeading);
      setHeading(newHeading);
      setIsCalibrated(true);
    };

    orientationHandler.current = handleOrientation;

    if (permissionGranted) {
      console.log("Adding orientation event listener");
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      console.log("Removing orientation event listener");
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [permissionGranted]);

  // Request permission for device orientation
  const requestPermission = async () => {
    console.log("Requesting device orientation permission");
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        console.log("iOS permission flow");
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          console.log("Permission granted on iOS");
          setPermissionGranted(true);
        }
      } else {
        console.log("Non-iOS device, permission not required");
        setPermissionGranted(true);
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  };

  // Calculate compass rotation with smooth transitions
  const getCompassRotation = () => {
    if (heading === null) {
      console.log("No heading, showing Qibla direction:", qiblaDirection);
      return qiblaDirection;
    }
    
    let rotation = (qiblaDirection - heading + 360) % 360;
    
    // Корректировка для плавного перехода через 0°
    if (rotation > 180) {
      rotation = rotation - 360;
    }

    console.log("Calculated rotation:", rotation);
    return rotation;
  };

  // Debug info
  useEffect(() => {
    console.log("Current state:", {
      coords,
      heading,
      permissionGranted,
      qiblaDirection,
      isCalibrated
    });
  }, [coords, heading, permissionGranted, qiblaDirection, isCalibrated]);

  return (
    <div className={styles.compassContainer}>
      <div className={styles.compassBackground}>
        <div className={styles.compassDegreeMarkers}>
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className={styles.degreeMarker}
              style={{ transform: `rotate(${i * 10}deg)` }}
            >
              {i % 9 === 0 && (
                <span className={styles.degreeNumber}>{i * 10}</span>
              )}
            </div>
          ))}
        </div>

        <div
          className={styles.compassArrow}
          style={{ 
            transform: `rotate(${getCompassRotation()}deg)`,
            transition: isCalibrated ? 'transform 0.1s linear' : 'none'
          }}
        >
          <ArrowUp size={48} color="#e74c3c" />
          <div className={styles.kaabaIndicator}>Кибла</div>
        </div>

        <div className={styles.compassCenterPoint} />
      </div>

      {!permissionGranted && (
        <button 
          className={styles.permissionButton} 
          onClick={requestPermission}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            margin: '20px'
          }}
        >
          Разрешить доступ к компасу
        </button>
      )}

      {!isCalibrated && permissionGranted && (
        <div className={styles.calibrationMessage}>
          Держите устройство горизонтально для калибровки
        </div>
      )}

      {coords && (
        <div className={styles.coordinatesInfo}>
          <p>Направление на Каабу: {qiblaDirection.toFixed(1)}°</p>
          {heading !== null && <p>Текущий азимут: {heading.toFixed(1)}°</p>}
        </div>
      )}
    </div>
  );
};