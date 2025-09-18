// import React, { useState, useCallback } from "react";
// import styles from "./Home.module.css";
// import { PageWrapper } from "../../shared/PageWrapper";
// import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
// import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
// import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
// import { useGeoStore } from "../../hooks/useGeoStore";
// import { QiblaMap } from "./QiblaCompass/QiblaMap";
// import { Header } from "../../components/header/Header";
// import { t } from "i18next";
// import { useNavigate } from "react-router-dom";
// import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";

// // Проверяем, является ли устройство iOS
// const isIOS = () => {
//   const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
//   console.log("📱 iOS device detection:", isIOSDevice, "UserAgent:", navigator.userAgent);
//   return isIOSDevice;
// };

// // Проверяем, требуется ли запрос разрешения
// const requiresPermission = () => {
//   const hasRequestPermission = isIOS() &&
//     typeof DeviceOrientationEvent !== "undefined" &&
//     typeof (DeviceOrientationEvent as any).requestPermission === "function";
  
//   console.log("🔍 Requires permission check:", {
//     isIOS: isIOS(),
//     hasDeviceOrientation: typeof DeviceOrientationEvent !== "undefined",
//     hasRequestPermission: typeof (DeviceOrientationEvent as any).requestPermission === "function",
//     result: hasRequestPermission
//   });
  
//   return hasRequestPermission;
// };

// export const Home: React.FC = () => {
//   const navigate = useNavigate();
//   const { isLoading, error } = useGeoStore();

//   const [sensorPermission, setSensorPermission] = useState<string>("prompt");
//   const [isRequestingPermission, setIsRequestingPermission] = useState(false);

//   console.log("🏠 Home component render - Sensor permission:", sensorPermission, "Requesting:", isRequestingPermission);

//   // Функция запроса разрешения
//   const requestSensorPermission = useCallback(async () => {
//     console.log("🔄 Starting sensor permission request...");
//     setIsRequestingPermission(true);
    
//     try {
//       if (requiresPermission()) {
//         console.log("📱 iOS device detected, requesting permission...");
//         // iOS - запрашиваем разрешение
//         const result = await (
//           DeviceOrientationEvent as any
//         ).requestPermission();
//         console.log("✅ iOS permission request result:", result);
//         setSensorPermission(result);
//       } else {
//         console.log("🤖 Non-iOS device, permission granted automatically");
//         // Android и другие устройства - разрешение не требуется
//         setSensorPermission("granted");
//       }
//     } catch (err) {
//       console.error("❌ Sensor permission error:", err);
//       setSensorPermission("denied");
//     } finally {
//       console.log("🏁 Permission request finished");
//       setIsRequestingPermission(false);
//     }
//   }, []);

//   // Обработка клика на компас
//   const handleCompassClick = useCallback(async () => {
//     console.log("🧭 Compass clicked, current permission:", sensorPermission);
    
//     if (sensorPermission === "denied") {
//       console.warn("🚫 Permission denied, showing alert");
//       alert(t("sensorPermissionDeniedMessage"));
//       return;
//     }

//     if (sensorPermission === "prompt" && requiresPermission()) {
//       console.log("📱 iOS device needs permission, requesting...");
//       // iOS - нужно запросить разрешение
//       setIsRequestingPermission(true);
//       try {
//         const result = await (
//           DeviceOrientationEvent as any
//         ).requestPermission();
//         console.log("✅ Inline permission request result:", result);
//         setSensorPermission(result);

//         if (result === "granted") {
//           console.log("🎉 Permission granted, navigating to qibla compass");
//           navigate("/qibla", { state: { activeTab: "compass" } });
//         } else {
//           console.warn("❌ Permission not granted, showing alert");
//           alert(t("sensorPermissionRequired"));
//         }
//       } catch (err) {
//         console.error("❌ Inline permission request error:", err);
//         setSensorPermission("denied");
//         alert(t("sensorPermissionError"));
//       } finally {
//         setIsRequestingPermission(false);
//       }
//     } else {
//       console.log("➡️ Permission already granted or not required, navigating to qibla compass");
//       // Разрешение уже есть или не требуется
//       navigate("/qibla", { state: { activeTab: "compass" } });
//     }
//   }, [sensorPermission, navigate]);

//   const handleMapClick = useCallback(() => {
//     console.log("🗺️ Map clicked, navigating to qibla map");
//     navigate("/qibla", { state: { activeTab: "map" } });
//   }, [navigate]);

//   // Функция для открытия настроек iOS (если возможно)
//   const openSettings = useCallback(() => {
//     if (isIOS()) {
//       // Попытка открыть настройки Safari
//       window.open('app-settings:');
//     }
//   }, []);

//   const showPermissionButton = requiresPermission() && 
//                              sensorPermission !== "granted" && 
//                              sensorPermission !== "denied";
  
//   console.log("👀 Show permission button:", showPermissionButton);

//   return (
//     <PageWrapper>
//       <Header />

//       {/* Кнопка запроса доступа к датчикам */}
//       {showPermissionButton && (
//         <button
//           className={styles.allowSensorButton}
//           onClick={requestSensorPermission}
//           disabled={isRequestingPermission}
//         >
//           {isRequestingPermission ? t("requesting") : t("allowSensors")}
//         </button>
//       )}

//       {/* Сообщение об отказе с инструкцией */}
//       {sensorPermission === "denied" && (
//         <div className={styles.permissionDeniedMessage}>
//           <p>{t("sensorPermissionDeniedMessage")}</p>
//           <p style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
//             {t("sensorPermissionInstructions")}
//           </p>
//           <button 
//             onClick={openSettings}
//             className={styles.settingsButton}
//             style={{
//               marginTop: '12px',
//               padding: '8px 16px',
//               backgroundColor: '#007AFF',
//               color: 'white',
//               border: 'none',
//               borderRadius: '8px',
//               cursor: 'pointer'
//             }}
//           >
//             {t("openSettings")}
//           </button>
//         </div>
//       )}

//       <div className={styles.homeRoot}>
//         {isLoading && (
//           <div className={styles.loadingContainer}>
//             <LoadingSpinner />
//           </div>
//         )}

//         {error && <div className={styles.errorContainer}>{error}</div>}

//         {!isLoading && !error && (
//           <>
//             <div className={styles.prayerTimesQiblaContainer}>
//               <PrayerTimes />

//               <div className={styles.qiblaBlock}>
//                 <div className={styles.titleFaceKaaba}>{t("faceTheKaaba")}</div>
//                 <div className={styles.diskFaceKaaba}>
//                   {t("useMapForSalah")}
//                 </div>

//                 <div className={styles.qiblaBlockRow}>
//                   <div onClick={handleMapClick} className={styles.mapContainer}>
//                     <QiblaMap onMapClick={handleMapClick} />
//                   </div>

//                   <div
//                     onClick={handleCompassClick}
//                     className={styles.compassContainer}
//                   >
//                     <QiblaCompass
//                       permissionGranted={sensorPermission === "granted"}
//                     />
//                   </div>
//                 </div>
//               </div>
//               <div className={styles.locationMay}>{t("locationMay")}</div>
//             </div>

//             <MenuBlocks />
//           </>
//         )}
//       </div>
//     </PageWrapper>
//   );
// };
// Home.tsx (исправленная версия)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Home.css';

const Home: React.FC = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const permissionRef = useRef<boolean>(false);

  // Проверяем поддержку DeviceOrientation API
  const isDeviceOrientationSupported = useCallback((): boolean => {
    return 'DeviceOrientationEvent' in window && 
           typeof (DeviceOrientationEvent as any).requestPermission === 'function';
  }, []);

  // Запрос разрешения на доступ к ориентации
  const requestOrientationPermission = async (): Promise<void> => {
    setIsLoading(true);
    setError('');

    try {
      if (!isDeviceOrientationSupported()) {
        setError('DeviceOrientation API не поддерживается вашим браузером');
        setIsLoading(false);
        return;
      }

      // Используем any для обхода типизации
      const DeviceOrientationEventWithPermission = DeviceOrientationEvent as any;
      const permission = await DeviceOrientationEventWithPermission.requestPermission();
      
      if (permission === 'granted') {
        setPermissionGranted(true);
        permissionRef.current = true;
        startCompass();
      } else {
        setError('Разрешение на доступ к ориентации отклонено');
        setPermissionGranted(false);
      }
    } catch (err) {
      setError('Ошибка при запросе разрешения: ' + (err as Error).message);
      setPermissionGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Запуск компаса
  const startCompass = useCallback((): (() => void) => {
    if (!permissionRef.current) return () => {};

    const handleOrientation = (event: DeviceOrientationEvent): void => {
      if (event.alpha !== null) {
        setCompassHeading(Math.round(event.alpha));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation as EventListener);

    // Возвращаем функцию очистки
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Автоматически запускаем компас если разрешение уже есть
    if (permissionGranted) {
      cleanup = startCompass();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [permissionGranted, startCompass]);

  // Функция для преобразования градусов в направление
  const getDirection = useCallback((degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }, []);

  return (
    <div className="home">
      <div className="container">
        <h1>Компас TWA</h1>
        
        {!permissionGranted ? (
          <div className="permission-section">
            <p>Для работы компаса необходимо разрешение на доступ к ориентации устройства</p>
            <button 
              onClick={requestOrientationPermission}
              disabled={isLoading}
              className="permission-button"
            >
              {isLoading ? 'Запрос...' : 'Разрешить доступ к ориентации'}
            </button>
          </div>
        ) : (
          <div className="compass-section">
            <div className="compass">
              <div 
                className="compass-needle"
                style={{ transform: `rotate(${compassHeading}deg)` }}
              >
                <div className="needle"></div>
              </div>
              <div className="compass-circle"></div>
            </div>
            
            <div className="compass-info">
              <p>Направление: {getDirection(compassHeading)}</p>
              <p>Градусы: {compassHeading}°</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {!isDeviceOrientationSupported() && (
          <div className="warning">
            <p>Ваш браузер не поддерживает необходимые API для работы компаса</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;