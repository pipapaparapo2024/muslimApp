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
// };import React, { useState, useEffect } from "react";
import { Camera, X, Image } from "lucide-react";
import "./TelegramCamera.css";
import { useEffect, useState } from "react";

interface TelegramCameraProps {
  onPhotoTaken: (file: File) => void;
  onClose?: () => void;
}

// Хук для доступа к Telegram Web App
const useTelegram = () => {
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      setWebApp(window.Telegram.WebApp);
      
      // Не используем expand() так как его может не быть в типах
      // Telegram Web App автоматически занимает весь экран в TWA
    }
  }, []);

  return { webApp };
};

export const TelegramCamera: React.FC<TelegramCameraProps> = ({
  onPhotoTaken,
  onClose,
}) => {
  const { webApp } = useTelegram();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Проверяем доступность Telegram Camera API
  const isCameraAvailable = webApp && typeof webApp.showCamera === 'function';
  const isPhotoPickerAvailable = webApp && typeof webApp.showPhotoPicker === 'function';

  const openTelegramCamera = async () => {
    if (!isCameraAvailable) {
      setError("Камера недоступна в этой версии Telegram");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Используем нативное API Telegram для открытия камеры
      webApp.showCamera(
        (photoData: string) => {
          // Фото получено в base64
          handlePhotoData(photoData);
          setIsLoading(false);
        },
        (error: string) => {
          console.error("Camera error:", error);
          setError("Не удалось открыть камеру");
          setIsLoading(false);
        },
        {
          format: "jpg",
          quality: 0.8,
          allowGallery: true,
          cameraPosition: "back",
        }
      );
    } catch (err) {
      console.error("Error opening camera:", err);
      setError("Ошибка при открытии камеры");
      setIsLoading(false);
    }
  };

  const handlePhotoData = (base64Data: string) => {
    try {
      // Убираем префикс data:image/jpeg;base64, если есть
      const base64WithoutPrefix = base64Data.startsWith('data:') 
        ? base64Data.split(',')[1] 
        : base64Data;
      
      const byteString = atob(base64WithoutPrefix);
      const mimeType = 'image/jpeg';

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeType });
      const file = new File([blob], "telegram-camera.jpg", { type: mimeType });

      onPhotoTaken(file);
    } catch (err) {
      console.error("Error processing photo:", err);
      setError("Ошибка обработки фото");
    }
  };

  const openGallery = () => {
    if (!isPhotoPickerAvailable) {
      setError("Галерея недоступна в этой версии Telegram");
      return;
    }

    webApp.showPhotoPicker(
      (photos: string[]) => {
        if (photos && photos.length > 0) {
          handlePhotoData(photos[0]);
        }
      },
      (error: string) => {
        console.error("Gallery error:", error);
        setError("Не удалось открыть галерею");
      },
      {
        maxCount: 1,
        mediaType: "photo",
      }
    );
  };

  // Автоматически открываем камеру при монтировании компонента
  useEffect(() => {
    if (isCameraAvailable) {
      openTelegramCamera();
    }
  }, [isCameraAvailable]);

  if (!webApp) {
    return (
      <div className="telegram-camera-fallback">
        <p>Telegram Web App не доступен</p>
        <button onClick={onClose} className="close-btn">
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="telegram-camera">
      <div className="telegram-camera__header">
        <h3>📷 Сделайте фото</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="telegram-camera__content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Открываем камеру...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <div className="error-actions">
              {isCameraAvailable && (
                <button onClick={openTelegramCamera} className="retry-btn">
                  Попробовать снова
                </button>
              )}
              {isPhotoPickerAvailable && (
                <button onClick={openGallery} className="gallery-btn">
                  <Image size={16} />
                  Из галереи
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="camera-ready">
            <div className="camera-placeholder">
              <Camera size={48} />
              <p>Камера готова к использованию</p>
            </div>

            <div className="camera-actions">
              {isCameraAvailable && (
                <button onClick={openTelegramCamera} className="camera-btn">
                  <Camera size={20} />
                  Открыть камеру
                </button>
              )}
              
              {isPhotoPickerAvailable && (
                <button onClick={openGallery} className="gallery-btn">
                  <Image size={20} />
                  Выбрать из галереи
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!isCameraAvailable && (
        <div className="version-warning">
          <p>⚠️ Для работы камеры обновите Telegram до последней версии</p>
          {isPhotoPickerAvailable && (
            <button onClick={openGallery} className="gallery-btn">
              <Image size={16} />
              Выбрать из галереи
            </button>
          )}
        </div>
      )}
    </div>
  );
};