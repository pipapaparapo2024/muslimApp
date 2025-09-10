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
import React, { useState, useRef, useEffect } from 'react';
import { PageWrapper } from "../../shared/PageWrapper";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { Camera, TriangleAlert, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import styles from "./Scanner.module.css";

interface ScannerProps {
  onPhotoTaken?: (photoData: string) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onPhotoTaken }) => {
  const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isLoading, processImage } = useScannerStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selectedRequests, setSelectedRequests] = useState("1"); // Изменено на string

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Проверяем поддержку mediaDevices
  const isMediaDevicesSupported = (): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const startCamera = async () => {
    if (!isMediaDevicesSupported()) {
      setCameraError('Ваш браузер не поддерживает доступ к камере');
      return;
    }

    try {
      setCameraError(null);
      setIsCameraActive(true);
      
      // Запрашиваем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Используем заднюю камеру
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      setCameraError('Не удалось получить доступ к камере. Проверьте разрешения.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Устанавливаем размеры canvas как у видео
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Рисуем текущий кадр видео на canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Конвертируем в data URL
      const photoData = canvas.toDataURL('image/png');
      setPhotoPreview(photoData);
      onPhotoTaken?.(photoData);
      
      // Останавливаем камеру после съемки
      stopCamera();
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setCameraError(null);
  };

  const retakePhoto = () => {
    clearPhoto();
    startCamera();
  };

  const handleProcessPhoto = async () => {
    if (photoPreview) {
      try {
        // Конвертируем data URL в Blob
        const response = await fetch(photoPreview);
        const blob = await response.blob();
        
        // Создаем File из Blob
        const file = new File([blob], "scanned-image.png", { type: "image/png" });
        
        // Перенаправляем на страницу анализа
        navigate("/scanner/analyze");
        
        // Обрабатываем изображение
        setTimeout(async () => {
          try {
            await processImage(file);
          } catch (error) {
            console.error("Ошибка обработки:", error);
          }
        }, 100);
      } catch (error) {
        console.error("Ошибка конвертации фото:", error);
      }
    }
  };

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return t("scanPicture");
    }
    return t("buyRequests");
  };

  const showAskButton = hasPremium || (requestsLeft != null && requestsLeft > 0);

  // Останавливаем камеру при размонтировании компонента
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (photoPreview) {
    return (
      <PageWrapper showBackButton navigateTo="/home">
        <div className={styles.container}>
          <div className={styles.table}>
            <TableRequestsHistory text="/scanner/historyScanner" />
          </div>

          <div className={styles.content}>
            <div className={styles.photoPreview}>
              <img 
                src={photoPreview} 
                alt="Предпросмотр" 
                className={styles.previewImage}
              />
            </div>

            <div className={styles.halalCheck}>
              <span>{t("instantHalalCheck")}</span>
              <p>{t("takePhotoCheck")}</p>
              <p className={styles.warning}>
                <TriangleAlert
                  strokeWidth={1.5}
                  size={18}
                  color="white"
                  fill="#F59E0B"
                />
                {t("informationalOnly")}
              </p>
            </div>
          </div>

          <div className={styles.scanButtonContainer}>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
              <button 
                onClick={handleProcessPhoto}
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : t("processPhoto")}
              </button>
              <button 
                onClick={retakePhoto}
                className={styles.secondaryButton}
              >
                📷 {t("retakePhoto")}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (isCameraActive) {
    return (
      <PageWrapper showBackButton navigateTo="/home">
        <div className={styles.container}>
          <div className={styles.table}>
            <TableRequestsHistory text="/scanner/historyScanner" />
          </div>

          <div className={styles.content}>
            <div className={styles.cameraPreview}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.videoElement}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className={styles.halalCheck}>
              <span>{t("instantHalalCheck")}</span>
              <p>{t("takePhotoCheck")}</p>
              <p className={styles.warning}>
                <TriangleAlert
                  strokeWidth={1.5}
                  size={18}
                  color="white"
                  fill="#F59E0B"
                />
                {t("informationalOnly")}
              </p>
            </div>
          </div>

          <div className={styles.scanButtonContainer}>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
              <button 
                onClick={takePhoto}
                className={styles.submitButton}
              >
                📸 {t("takePhoto")}
              </button>
              <button 
                onClick={stopCamera}
                className={styles.secondaryButton}
              >
                ❌ {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton navigateTo="/home">
      <div className={styles.container}>
        <div className={styles.table}>
          <TableRequestsHistory text="/scanner/historyScanner" />
        </div>

        <div className={styles.content}>
          <div className={styles.illustration}>
            <div className={styles.cameraPlaceholder}>
              <Camera size={64} />
            </div>
          </div>

          <div className={styles.halalCheck}>
            <span>{t("instantHalalCheck")}</span>
            <p>{t("takePhotoCheck")}</p>
            <p className={styles.warning}>
              <TriangleAlert
                strokeWidth={1.5}
                size={18}
                color="white"
                fill="#F59E0B"
              />
              {t("informationalOnly")}
            </p>
          </div>
        </div>

        <div className={styles.scanButtonContainer}>
          {cameraError && (
            <div className={styles.errorMessage}>
              {cameraError}
            </div>
          )}
          
          <button
            className={styles.submitButton}
            onClick={showAskButton ? startCamera : () => setShowModal(true)}
            disabled={!isMediaDevicesSupported()}
          >
            {showAskButton ? (
              <Camera strokeWidth={1.5} />
            ) : (
              <Wallet strokeWidth={1.5} />
            )}
            {getButtonText()}
          </button>

          {!isMediaDevicesSupported() && (
            <div className={styles.browserWarning}>
              {t("browserNotSupported")}
            </div>
          )}
        </div>
      </div>

      <BuyRequestsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </PageWrapper>
  );
};