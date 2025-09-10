// import React, { useCallback, useEffect, useRef, useState } from "react";
// import styles from "./Scanner.module.css";
// import { PageWrapper } from "../../shared/PageWrapper";
// import { usePremiumStore } from "../../hooks/usePremiumStore";
// import { Camera, TriangleAlert, Wallet } from "lucide-react";
// import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
// import scanner from "../../assets/image/scanner.png";
// import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
// import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
// import { useScannerStore } from "../../hooks/useScannerStore";
// import { useNavigate } from "react-router-dom";
// import { t } from "i18next";

// export const Scanner: React.FC = () => {
//   const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
//   const [showModal, setShowModal] = useState(false);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [, setImageError] = useState(false);
//   const navigate = useNavigate();
//   const cameraInputRef = useRef<HTMLInputElement>(null);
//   const [selectedRequests, setSelectedRequests] = useState("10");
//   const { isLoading, processImage } = useScannerStore();
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const openFilePicker = useCallback(() => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   }, []);
//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   useEffect(() => {
//     const img = new Image();
//     img.src = scanner;

//     img.onload = () => {
//       setImageLoaded(true);
//     };

//     img.onerror = () => {
//       console.error("Failed to load scanner image:", scanner);
//       setImageError(true);
//       setImageLoaded(true);
//     };
//   }, []);

//   const handleFileSelect = async (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       navigate("/scanner/analyze");

//       setTimeout(async () => {
//         try {
//           await processImage(file);
//         } catch (error) {
//           console.error("Ошибка обработки:", error);
//         }
//       }, 100);
//     }

//     if (event.target) {
//       event.target.value = "";
//     }
//   };

//   const getButtonText = () => {
//     if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
//       return t("scanPicture");
//     }
//     return t("buyRequests");
//   };

//   const showAskButton =
//     hasPremium || (requestsLeft != null && requestsLeft > 0);

//   if (!imageLoaded) {
//     return (
//       <PageWrapper>
//         <LoadingSpinner />
//       </PageWrapper>
//     );
//   }

//   return (
//     <PageWrapper showBackButton navigateTo="/home">
//       <div className={styles.container}>
//         <div className={styles.table}>
//           <TableRequestsHistory text="/scanner/historyScanner" />
//         </div>

//         {/* Input для браузеров и fallback */}
//         <input
//           type="file"
//           ref={cameraInputRef}
//           accept="image/*"
//           capture="environment"
//           onChange={handleFileSelect}
//           style={{ display: "none" }}
//         />

//         {/* Центральный контент */}
//         <div className={styles.content}>
//           <div className={styles.illustration}>
//             <img src={scanner} alt={t("instantHalalCheck")} />
//           </div>

//           <div className={styles.halalCheck}>
//             <span>{t("instantHalalCheck")}</span>
//             <p>{t("takePhotoCheck")}</p>
//             <p className={styles.warning}>
//               <TriangleAlert
//                 strokeWidth={1.5}
//                 size={18}
//                 color="white"
//                 fill="#F59E0B"
//               />
//               {t("informationalOnly")}
//             </p>
//           </div>
//         </div>

//         {/* Кнопка сканирования */}
//         <div className={styles.scanButtonContainer}>
//           <button
//             className={styles.submitButton}
//             onClick={showAskButton ? openFilePicker : () => setShowModal(true)}
//             disabled={isLoading}
//           >
//             {showAskButton ? (
//               <Camera strokeWidth={1.5} />
//             ) : (
//               <Wallet strokeWidth={1.5} />
//             )}
//             {getButtonText()}
//           </button>
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             onChange={handleFileSelect}
//             style={{ display: "none" }}
//           />
//         </div>
//       </div>

//       <BuyRequestsModal
//         isOpen={showModal}
//         onClose={() => setShowModal(false)}
//         selectedRequests={selectedRequests}
//         onSelectRequests={setSelectedRequests}
//       />
//     </PageWrapper>
//   );
// };

import React, { useState, useEffect, useRef } from 'react';

export const Scanner: React.FC = () => {
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Автоматически открываем камеру при монтировании компонента
    openCamera();
    
    // Очистка при размонтировании
    return () => {
      closeCamera();
    };
  }, []);

  const openCamera = async () => {
    try {
      // Проверяем поддержку getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Ваш браузер не поддерживает камеру');
        return;
      }

      // Пытаемся сначала использовать заднюю камеру
      let constraints: MediaStreamConstraints = { 
        video: {
          facingMode: 'environment', // Задняя камера
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleStreamSuccess(stream);
      } catch (backCameraError) {
        console.log('Задняя камера недоступна, пробуем переднюю:', backCameraError);
        
        // Если задняя камера недоступна, пробуем переднюю
        constraints = { 
          video: {
            facingMode: 'user', // Передняя камера
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false 
        };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          handleStreamSuccess(stream);
        } catch (frontCameraError) {
          console.log('Передняя камера тоже недоступна:', frontCameraError);
          
          // Пробуем без специфичных настроек
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            handleStreamSuccess(stream);
          } catch (finalError) {
            throw finalError;
          }
        }
      }

    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      setCameraError('Не удалось получить доступ к камере. Проверьте разрешения.');
    }
  };

  const handleStreamSuccess = (stream: MediaStream) => {
    streamRef.current = stream;
    setCameraError('');

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(playError => {
        console.error('Ошибка воспроизведения видео:', playError);
      });
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context && videoRef.current.videoWidth > 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Здесь можно сохранить или отправить фото
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Фото сделано:', imageData);
      alert('Фото сделано! Проверьте консоль для данных.');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>📷 Сканер</h1>
        
        <div className="camera-container">
          <video 
            ref={videoRef}
            className="camera-preview"
            playsInline // Важно для iOS
            autoPlay // Автоматическое воспроизведение
            muted // Без звука для автозапуска
          />
          
          {cameraError && (
            <div className="error-message">
              {cameraError}
              <button onClick={openCamera} className="retry-button">
                Повторить
              </button>
            </div>
          )}

          <div className="camera-controls">
            <button onClick={takePhoto} className="take-photo-btn">
              📷 Сделать фото
            </button>
            <button onClick={closeCamera} className="close-camera-btn">
              ✕ Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Стили (добавьте в ваш CSS файл)
const styles = `
.app {
  min-height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.container {
  width: 100%;
  max-width: 100%;
  text-align: center;
}

h1 {
  color: white;
  margin-bottom: 20px;
  font-size: 24px;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
}

.camera-preview {
  width: 100%;
  height: 400px;
  object-fit: cover;
  background: #222;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.retry-button {
  background: white;
  color: #ff0000;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 10px;
  cursor: pointer;
}

.camera-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.take-photo-btn, .switch-camera-btn, .close-camera-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.take-photo-btn:hover, .switch-camera-btn:hover, .close-camera-btn:hover {
  background: white;
  transform: scale(1.05);
}

.instructions {
  margin-top: 20px;
  color: white;
}

.instructions p {
  margin: 5px 0;
  color: #ccc;
}

.instructions small {
  color: #888;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 480px) {
  .camera-preview {
    height: 300px;
  }
  
  .camera-controls {
    bottom: 10px;
  }
  
  .take-photo-btn, .switch-camera-btn, .close-camera-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}
`;

// Добавляем стили в документ
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Scanner;