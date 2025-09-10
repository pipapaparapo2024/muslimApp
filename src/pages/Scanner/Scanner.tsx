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

interface CameraButtonProps {
  onPhotoTaken?: (photoData: string) => void;
}

export const Scanner: React.FC<CameraButtonProps> = ({ onPhotoTaken }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <img 
          src={photoPreview} 
          alt="Предпросмотр" 
          style={{ 
            maxWidth: '300px', 
            maxHeight: '400px', 
            border: '2px solid #ddd',
            borderRadius: '10px'
          }} 
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={retakePhoto}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📷 Переснять
          </button>
          <button 
            onClick={clearPhoto}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ❌ Отмена
          </button>
        </div>
      </div>
    );
  }

  if (isCameraActive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '300px',
            border: '2px solid #007bff',
            borderRadius: '10px',
            objectFit: 'cover'
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={takePhoto}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📸 Сделать фото
          </button>
          <button 
            onClick={stopCamera}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ❌ Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {cameraError && (
        <div style={{ 
          color: '#dc3545', 
          backgroundColor: '#f8d7da',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          {cameraError}
        </div>
      )}
      
      <button 
        onClick={startCamera}
        disabled={!isMediaDevicesSupported()}
        style={{
          backgroundColor: isMediaDevicesSupported() ? '#007bff' : '#6c757d',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          borderRadius: '5px',
          cursor: isMediaDevicesSupported() ? 'pointer' : 'not-allowed',
          fontSize: '16px'
        }}
      >
        📷 {isMediaDevicesSupported() ? 'Открыть камеру' : 'Камера не поддерживается'}
      </button>

      {!isMediaDevicesSupported() && (
        <div style={{ 
          color: '#6c757d', 
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          Ваш браузер не поддерживает прямой доступ к камере. 
          Попробуйте использовать современный браузер (Chrome, Safari, Firefox).
        </div>
      )}
    </div>
  );
};