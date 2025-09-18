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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const compassRef = useRef<HTMLDivElement>(null);

  // Проверяем, iOS ли это устройство
  useEffect(() => {
    const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isAppleDevice);
    checkInitialPermission();
  }, []);

  // Проверяем начальное состояние разрешения
  const checkInitialPermission = async (): Promise<void> => {
    try {
      // Для iOS проверяем, нужно ли запрашивать разрешение
      if (isPermissionRequestNeeded()) {
        setHasPermission(false);
      } else {
        // Для Android и других устройств пробуем запустить компас
        if (isDeviceOrientationSupported()) {
          setHasPermission(true);
          startCompass();
        }
      }
    } catch (err) {
      setError('Ошибка при проверке разрешений');
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем поддержку DeviceOrientation
  const isDeviceOrientationSupported = (): boolean => {
    return 'DeviceOrientationEvent' in window;
  };

  // Проверяем, нужен ли запрос разрешения (для iOS)
  const isPermissionRequestNeeded = (): boolean => {
    if (!isIOS) return false;
    
    const event = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
    return typeof event.requestPermission === 'function';
  };

  // Запрос разрешения для iOS
  const requestPermission = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      const event = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
      
      if (event.requestPermission) {
        const permission = await event.requestPermission();
        
        if (permission === 'granted') {
          setHasPermission(true);
          setPermissionRequested(true);
          startCompass();
        } else {
          setHasPermission(false);
          setPermissionRequested(true);
          setError('Разрешение на доступ к датчикам ориентации отклонено');
        }
      }
    } catch (err) {
      setError(`Ошибка при запросе разрешения: ${(err as Error).message}`);
      setPermissionRequested(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Запуск отслеживания ориентации
  const startCompass = (): (() => void) => {
    if (!isDeviceOrientationSupported()) {
      setError('Датчики ориентации не поддерживаются вашим устройством');
      return () => {};
    }

    const handleOrientation = (event: DeviceOrientationEvent): void => {
      if (event.alpha !== null) {
        setAlpha(event.alpha);
        
        // Поворачиваем компас
        if (compassRef.current) {
          compassRef.current.style.transform = `rotate(${-event.alpha}deg)`;
        }
      }
    };

    // Добавляем обработчик
    window.addEventListener('deviceorientation', handleOrientation as EventListener);

    // Функция очистки
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
    };
  };

  // Обработчик для не-iOS устройств
  const handleNonIOSClick = (): void => {
    if (!hasPermission && isDeviceOrientationSupported()) {
      setHasPermission(true);
      startCompass();
    }
  };

  // Определяем, что показывать на кнопке
  const getButtonText = (): string => {
    if (isLoading) return 'Проверка...';
    if (!isDeviceOrientationSupported()) return 'Датчики не поддерживаются';
    
    if (isPermissionRequestNeeded()) {
      return hasPermission ? 'Доступ разрешен' : 'Запросить доступ к датчикам';
    }
    
    return hasPermission ? 'Компас активен' : 'Активировать компас';
  };

  // Определяем, активна ли кнопка
  const isButtonDisabled = (): boolean => {
    return isLoading || 
           !isDeviceOrientationSupported() || 
           hasPermission || 
           (isPermissionRequestNeeded() && permissionRequested && !hasPermission);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧭 Компас TWA</h1>
      
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Визуализация компаса */}
      <div style={styles.compassWrapper}>
        <div ref={compassRef} style={{
          ...styles.compass,
          opacity: hasPermission ? 1 : 0.5
        }}>
          <div style={styles.compassNeedle}></div>
          <div style={styles.compassCenter}></div>
          <div style={styles.northIndicator}>N</div>
          <div style={styles.southIndicator}>S</div>
          {!hasPermission && (
            <div style={styles.compassOverlay}>
              ⚠️ Требуется разрешение
            </div>
          )}
        </div>
      </div>

      {/* Информация о направлении */}
      <div style={styles.info}>
        <p style={styles.direction}>
          Направление: <strong>{hasPermission ? `${alpha.toFixed(1)}°` : 'N/A'}</strong>
        </p>
        <p style={styles.status}>
          Статус: 
          <span style={{ 
            color: hasPermission ? '#27ae60' : '#e74c3c',
            fontWeight: 'bold'
          }}>
            {hasPermission ? ' АКТИВЕН' : ' НЕ АКТИВЕН'}
          </span>
        </p>
        <p style={styles.deviceInfo}>
          Устройство: {isIOS ? 'iOS' : 'Android/Другое'}
        </p>
      </div>

      {/* Кнопка запроса разрешения */}
      <button 
        style={{
          ...styles.button,
          ...(isButtonDisabled() ? styles.buttonDisabled : {}),
          ...(isLoading ? styles.buttonLoading : {})
        }}
        onClick={isPermissionRequestNeeded() ? requestPermission : handleNonIOSClick}
        disabled={isButtonDisabled()}
      >
        {getButtonText()}
      </button>

      {/* Инструкция для iOS */}
      {isIOS && !hasPermission && (
        <div style={styles.instruction}>
          <h3>📋 Инструкция для iOS:</h3>
          <ol style={styles.instructionList}>
            <li>Нажмите "Запросить доступ к датчикам"</li>
            <li>Разрешите доступ в появившемся окне</li>
            <li>Поворачивайте устройство для работы компаса</li>
          </ol>
        </div>
      )}

      {/* Сообщение о неподдерживаемом устройстве */}
      {!isDeviceOrientationSupported() && (
        <div style={styles.warning}>
          ⚠️ Ваше устройство или браузер не поддерживает датчики ориентации.
          Компас будет работать только на мобильных устройствах с поддержкой гироскопа.
        </div>
      )}
    </div>
  );
};

// Стили компонента
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
    backgroundColor: '#f5f5f5'
  },
  loading: {
    fontSize: '18px',
    color: '#7f8c8d',
    textAlign: 'center'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: 'bold'
  },
  compassWrapper: {
    width: '250px',
    height: '250px',
    margin: '0 auto 30px',
    position: 'relative'
  },
  compass: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '4px solid #34495e',
    position: 'relative',
    transition: 'all 0.3s ease',
    backgroundColor: '#ecf0f1',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  },
  compassOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '14px'
  },
  compassNeedle: {
    position: 'absolute',
    top: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '4px',
    height: '100px',
    backgroundColor: '#e74c3c',
    borderRadius: '2px'
  },
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#34495e',
    border: '3px solid #ecf0f1'
  },
  northIndicator: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  southIndicator: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  info: {
    marginBottom: '25px',
    color: '#7f8c8d'
  },
  direction: {
    fontSize: '18px',
    margin: '10px 0'
  },
  status: {
    fontSize: '16px',
    margin: '10px 0'
  },
  deviceInfo: {
    fontSize: '14px',
    margin: '10px 0',
    color: '#95a5a6'
  },
  button: {
    padding: '15px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: 'wait'
  },
  error: {
    color: '#e74c3c',
    backgroundColor: '#fadbd8',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    border: '1px solid #f5b7b1'
  },
  warning: {
    color: '#f39c12',
    backgroundColor: '#fef9e7',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    border: '1px solid #f9e79f'
  },
  instruction: {
    backgroundColor: '#d6eaf8',
    padding: '15px',
    borderRadius: '10px',
    marginTop: '20px',
    textAlign: 'left'
  },
  instructionList: {
    paddingLeft: '20px',
    margin: '10px 0 0 0'
  }
};