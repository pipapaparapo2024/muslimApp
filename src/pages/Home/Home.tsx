// import React from "react";
// import styles from "./Home.module.css";
// import { PageWrapper } from "../../shared/PageWrapper";
// import { MenuBlocks } from "./MenuBlocks/MenuBlocks";
// import { PrayerTimes } from "./PrayerTimes/PrayerTimes";
// import { QiblaCompass } from "./QiblaCompass/QiblaCompass";
// import { useGeoStore } from "../../hooks/useGeoStore";
// import { QiblaMap } from "./QiblaCompass/QiblaMap";
// import { Header } from "../../components/header/Header";
// import { t } from "i18next";
// import { useHomeLogic } from "./useHomeLogic";
// import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";

// export const Home: React.FC = () => {
//   const {
//     sensorPermission,
//     requestSensorPermission,
//     handleCompassClick,
//     handleMapClick,
//     isRequestingPermission,
//   } = useHomeLogic();

//   const { isLoading, error } = useGeoStore();

//   // Проверяем, iOS ли это устройство
//   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

//   return (
//     <PageWrapper>
//       <Header />
      
//       {/* === КНОПКА ЗАПРОСА ДОСТУПА ТОЛЬКО ДЛЯ iOS === */}
//       {isIOS && sensorPermission === "prompt" && (
//         <div style={{
//           position: 'fixed',
//           top: '100px',
//           right: '20px',
//           zIndex: 1000,
//           background: 'white',
//           padding: '15px',
//           borderRadius: '10px',
//           boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
//           textAlign: 'center'
//         }}>
//           <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
//             Для работы компаса нужен доступ к датчикам
//           </p>
//           <button
//             onClick={requestSensorPermission}
//             disabled={isRequestingPermission}
//             style={{
//               padding: '10px 15px',
//               backgroundColor: '#007AFF',
//               color: 'white',
//               border: 'none',
//               borderRadius: '8px',
//               fontSize: '14px',
//               cursor: 'pointer'
//             }}
//           >
//             {isRequestingPermission ? "Запрос..." : "Разрешить доступ"}
//           </button>
//         </div>
//       )}

//       {/* Отладочная информация (можно удалить после тестирования) */}
//       <div style={{
//         position: 'fixed',
//         top: '10px',
//         left: '10px',
//         background: 'rgba(0,0,0,0.7)',
//         color: 'white',
//         padding: '10px',
//         borderRadius: '5px',
//         fontSize: '12px',
//         zIndex: 1000
//       }}>
//         Статус: {sensorPermission}<br/>
//         Платформа: {isIOS ? 'iOS' : 'Другая'}
//       </div>

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
//             </div>

//             <MenuBlocks />
//           </>
//         )}
//       </div>
//     </PageWrapper>
//   );
// };
import React, { useState, useEffect, useRef } from 'react';

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export const Home: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [alpha, setAlpha] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const compassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(appleDevice);
    
    if (!isDeviceOrientationSupported()) {
      setError('Датчики ориентации не поддерживаются');
      return;
    }

    // Для не-iOS устройств пробуем запустить сразу
    if (!appleDevice) {
      try {
        setHasPermission(true);
        startCompass();
      } catch (err) {
        setError('Не удалось запустить компас');
      }
    }
  }, []);

  const isDeviceOrientationSupported = (): boolean => {
    return 'DeviceOrientationEvent' in window;
  };

  const isPermissionRequestNeeded = (): boolean => {
    if (!isIOS) return false;
    const event = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
    return typeof event.requestPermission === 'function';
  };

  const requestPermission = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      
      // Важно: этот код должен выполняться ТОЛЬКО в ответ на явное действие пользователя
      const event = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
      
      if (event.requestPermission) {
        console.log('Запрашиваем разрешение на iOS...');
        
        // Добавляем небольшую задержку для гарантии, что это user gesture
        setTimeout(async () => {
          try {
            const permission = await event.requestPermission!();
            
            if (permission === 'granted') {
              console.log('Разрешение получено!');
              setHasPermission(true);
              setPermissionRequested(true);
              startCompass();
            } else {
              console.log('Разрешение отклонено');
              setHasPermission(false);
              setPermissionRequested(true);
              setError('Доступ к датчикам отклонен. Разрешите доступ в настройках Safari.');
            }
          } catch (err) {
            console.error('Ошибка запроса:', err);
            setError('Ошибка при запросе разрешения. Проверьте настройки браузера.');
            setHasPermission(false);
          } finally {
            setIsLoading(false);
          }
        }, 100);
      } else {
        setError('Функция запроса разрешения недоступна');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Общая ошибка:', err);
      setError('Неожиданная ошибка');
      setIsLoading(false);
    }
  };

  const startCompass = (): (() => void) => {
    if (!isDeviceOrientationSupported()) {
      return () => {};
    }

    const handleOrientation = (event: DeviceOrientationEvent): void => {
      if (event.alpha !== null) {
        setAlpha(event.alpha);
        if (compassRef.current) {
          compassRef.current.style.transform = `rotate(${-event.alpha}deg)`;
        }
      }
    };

    // Пробуем оба варианта обработчиков
    const handler = handleOrientation as EventListener;
    
    window.addEventListener('deviceorientation', handler, { capture: true });
    window.addEventListener('deviceorientation', handler);

    return () => {
      window.removeEventListener('deviceorientation', handler, { capture: true });
      window.removeEventListener('deviceorientation', handler);
    };
  };

  const getButtonText = (): string => {
    if (isLoading) return 'Запрос разрешения...';
    if (permissionRequested && !hasPermission) return 'Повторить запрос';
    return 'Разрешить доступ к датчикам';
  };

  // Альтернативный метод для iOS 12+
  const tryAlternativeApproach = async (): Promise<void> => {
    try {
      // Пробуем добавить обработчик сначала - иногда это помогает
      const testHandler = () => {};
      window.addEventListener('deviceorientation', testHandler as EventListener);
      
      // Ждем немного и удаляем
      setTimeout(() => {
        window.removeEventListener('deviceorientation', testHandler as EventListener);
      }, 1000);
      
      // Пробуем запросить разрешение снова
      await requestPermission();
    } catch (err) {
      setError('Альтернативный метод не сработал');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧭 Компас</h1>
      
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.compassWrapper}>
        <div 
          ref={compassRef} 
          style={{
            ...styles.compass,
            opacity: hasPermission ? 1 : 0.4,
          }}
        >
          <div style={styles.compassNeedle}></div>
          <div style={styles.compassCenter}></div>
          <div style={styles.northIndicator}>N</div>
          
          {!hasPermission && (
            <div style={styles.compassOverlay}>
              🔒 Требуется доступ
            </div>
          )}
        </div>
      </div>

      <div style={styles.info}>
        <p style={styles.direction}>
          Направление: <strong>{hasPermission ? `${alpha.toFixed(1)}°` : '---'}</strong>
        </p>
        <p style={styles.status}>
          Статус: 
          <span style={{ 
            color: hasPermission ? '#27ae60' : '#e74c3c',
            fontWeight: 'bold'
          }}>
            {hasPermission ? 'АКТИВЕН' : 'НЕ АКТИВЕН'}
          </span>
        </p>
        <p style={styles.deviceInfo}>
          Устройство: {isIOS ? 'iOS' : 'Android'} • 
          Датчики: {isDeviceOrientationSupported() ? '✅' : '❌'}
        </p>
      </div>

      {isPermissionRequestNeeded() && !hasPermission && (
        <div style={styles.buttonContainer}>
          <button 
            style={{
              ...styles.button,
              ...(isLoading && styles.buttonLoading)
            }}
            onClick={requestPermission}
            disabled={isLoading}
          >
            {getButtonText()}
          </button>
          
          {permissionRequested && (
            <button 
              style={styles.secondaryButton}
              onClick={tryAlternativeApproach}
            >
              Попробовать другой метод
            </button>
          )}
        </div>
      )}

      {isIOS && !hasPermission && permissionRequested && (
        <div style={styles.instruction}>
          <h4>📱 Если доступ отклонен:</h4>
          <ol style={styles.instructionList}>
            <li>Откройте <strong>Настройки → Safari</strong></li>
            <li>Найдите настройки Motion & Orientation</li>
            <li>Разрешите доступ для этого сайта</li>
            <li>Перезагрузите страницу</li>
          </ol>
        </div>
      )}

      {!isDeviceOrientationSupported() && (
        <div style={styles.warning}>
          ⚠️ Ваше устройство не поддерживает датчики ориентации
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    textAlign: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '400px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa'
  },
  compassWrapper: {
    width: '200px',
    height: '200px',
    margin: '0 auto 25px',
    position: 'relative'
  },
  compass: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '3px solid #495057',
    position: 'relative',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
  },
  compassOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  compassNeedle: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '3px',
    height: '80px',
    backgroundColor: '#dc3545',
    borderRadius: '2px'
  },
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#495057',
    border: '2px solid #ffffff'
  },
  northIndicator: {
    position: 'absolute',
    top: '5px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  info: {
    marginBottom: '20px',
    color: '#495057'
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonLoading: {
    backgroundColor: '#6c757d',
    cursor: 'wait'
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #f5c6cb',
    fontSize: '14px'
  },
  instruction: {
    backgroundColor: '#d1ecf1',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
    textAlign: 'left'
  },
  instructionList: {
    paddingLeft: '20px',
    margin: '10px 0 0 0',
    fontSize: '14px'
  },
  warning: {
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #ffeaa7',
    fontSize: '14px'
  }
};