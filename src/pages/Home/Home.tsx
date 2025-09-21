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
//     resetSensorPermission, // Добавляем функцию сброса
//     handleCompassClick,
//     handleMapClick,
//     isRequestingPermission,
//     isInitializing,
//     initializationError,
//   } = useHomeLogic();

//   const { isLoading, error } = useGeoStore();

//   // Показываем лоадер во время инициализации
//   if (isInitializing) {
//     return (
//       <PageWrapper>
//         <div className={styles.loadingContainer}>
//           <LoadingSpinner />
//           <p>{t("initializingApp")}</p>
//         </div>
//       </PageWrapper>
//     );
//   }

//   // Показываем ошибку инициализации
//   if (initializationError) {
//     return (
//       <PageWrapper>
//         <div className={styles.errorContainer}>
//           <h2>{t("initializationError")}</h2>
//           <p>{initializationError}</p>
//           <button onClick={() => window.location.reload()}>
//             {t("tryAgain")}
//           </button>
//         </div>
//       </PageWrapper>
//     );
//   }

//   return (
//     <PageWrapper>
//       <Header />

//       {/* Кнопка сброса разрешения (только для отладки) */}
//       {sensorPermission === "granted" ||
//         (sensorPermission === "denied" && (
//           <button
//             className={styles.resetPermissionButton}
//             onClick={resetSensorPermission}
//             title={t("resetPermissionHint")}
//           >
//             {t("resetPermission")}
//           </button>
//         ))}

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
//                     <QiblaMap
//                       onMapClick={handleMapClick}
//                       showPermissionButton={sensorPermission !== "granted"}
//                       onRequestPermission={requestSensorPermission}
//                       isRequestingPermission={isRequestingPermission}
//                       orientationListenerActive={sensorPermission === "granted"} // Передаем состояние
//                     />
//                   </div>

//                   <div
//                     onClick={() => handleCompassClick(sensorPermission)}
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


import React, { useState, useEffect } from 'react';

export const Home: React.FC = () => {
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Проверяем, что мы в Telegram WebApp
    const isTWA = window.Telegram && window.Telegram.WebApp;
    setIsTelegram(!!isTWA);
  }, []);

  const shareStory = async () => {
    if (!isTelegram) {
      alert('Функция доступна только в Telegram');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Способ через WebApp (если доступен)
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          title: 'Публикация истории',
          message: 'Для публикации истории используйте кнопку "📷" в основном интерфейсе Telegram',
          // buttons: [{ type: 'ok' }]
        });
      } 
      // 2. Способ через открытие клиента Telegram
      else if (window.Telegram?.WebApp?.openTelegramLink) {
        // Открываем глубокую ссылку в Telegram
        window.Telegram.WebApp.openTelegramLink('https://t.me/share/url?url=https://your-app.com');
      }
      // 3. Fallback - пытаемся открыть стандартный интерфейс
      else {
        // Эта ссылка откроет интерфейс "поделиться" в Telegram
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://your-app.com')}&text=${encodeURIComponent('Посмотрите мою историю!')}`;
        
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(shareUrl);
        } else {
          window.open(shareUrl, '_blank');
        }
      }

    } catch (error) {
      console.error('Ошибка при публикации истории:', error);
      alert('Не удалось открыть интерфейс публикации. Возможно, функция недоступна в этой версии Telegram.');
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleButtonClick = () => {
    if (isTelegram) {
      shareStory();
    } else {
      alert('Откройте приложение в Telegram для публикации историй');
    }
  };

  // Альтернативный способ для десктопных версий Telegram
  const openTelegramApp = () => {
    // Ссылка для открытия Telegram с глубокой ссылкой
    const tgAppLink = 'tg://resolve?domain=your_bot_username&start=share_story';
    const tgWebLink = 'https://t.me/your_bot_username?start=share_story';
    
    // Пытаемся открыть приложение, если не получится - откроем веб-версию
    window.location.href = tgAppLink;
    setTimeout(() => {
      window.location.href = tgWebLink;
    }, 1000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📱 Истории</h2>
        
        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Приоритетный показ</h3>
          <p style={styles.featureText}>Больше просмотров за счёт показа Ваших историй в начале списка.</p>
        </div>

        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Режим инкогнито</h3>
          <p style={styles.featureText}>Возможность просматривать истории анонимно.</p>
        </div>

        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Улучшенное качество видео</h3>
          <p style={styles.featureText}>Просмотр видеоисторий в удвоенном разрешении.</p>
        </div>

        <div style={styles.feature}>
          <h3 style={styles.featureTitle}>Сохранение истории просмотров</h3>
          <p style={styles.featureText}>Доступ к списку просмотревших — даже если история истекла.</p>
        </div>

        <div style={styles.separator}></div>

        <button
          style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Загрузка...' : '🚀 Получить преимущества'}
        </button>

        {isLoading && <p style={styles.loadingText}>Открываем редактор историй...</p>}
        
        {!isTelegram && (
          <div style={styles.warningContainer}>
            <p style={styles.warningText}>
              ⚠️ Функция публикации историй доступна только в приложении Telegram
            </p>
            <button 
              style={styles.alternativeButton}
              onClick={openTelegramApp}
            >
              📲 Открыть в Telegram
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
  },
  feature: {
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  },
  featureTitle: {
    color: '#0088cc',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  featureText: {
    color: '#666',
    fontSize: '14px',
    margin: '0',
    lineHeight: '1.4',
  },
  separator: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '20px 0',
  },
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #0088cc, #00a2e4)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
    marginBottom: '12px',
  },
  buttonDisabled: {
    background: '#cccccc',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  },
  loadingText: {
    color: '#0088cc',
    fontSize: '14px',
    textAlign: 'center',
    margin: '0',
    fontStyle: 'italic',
  },
  warningContainer: {
    marginTop: '15px',
    textAlign: 'center',
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: '14px',
    margin: '0 0 10px 0',
    backgroundColor: '#fff0f0',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ffd6d6',
  },
  alternativeButton: {
    background: '#0088cc',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default Home;