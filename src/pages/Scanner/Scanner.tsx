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



import React, { useState } from 'react';

export const Scanner: React.FC = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');

  const openCamera = async () => {
    try {
      // Проверяем поддержку getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Ваш браузер не поддерживает камеру');
        return;
      }

      // Запрашиваем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'environment' // Используем заднюю камеру
        },
        audio: false 
      });
      
      setIsCameraOpen(true);
      setCameraError('');

      // Получаем видео элемент и устанавливаем поток
      const video = document.getElementById('camera-preview') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
      }

    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      setCameraError('Не удалось получить доступ к камере. Проверьте разрешения.');
    }
  };

  const closeCamera = () => {
    // Останавливаем все видео потоки
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    const canvas = document.getElementById('photo-canvas') as HTMLCanvasElement;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Здесь можно сохранить или отправить фото
        const imageData = canvas.toDataURL('image/png');
        console.log('Фото сделано:', imageData);
        alert('Фото сделано! Проверьте консоль для данных.');
      }
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>📷 Камера в TWA</h1>
        
        {!isCameraOpen ? (
          <>
            <button 
              className="camera-button"
              onClick={openCamera}
            >
              📸 Открыть камеру
            </button>
            
            {cameraError && (
              <div className="error-message">
                {cameraError}
              </div>
            )}

            <div className="instructions">
              <p>Нажмите кнопку чтобы открыть камеру</p>
              <small>Работает на Android и iOS</small>
            </div>
          </>
        ) : (
          <div className="camera-container">
            <video 
              id="camera-preview" 
              className="camera-preview"
              playsInline // Важно для iOS
            />
            
            <canvas id="photo-canvas" style={{display: 'none'}} />
            
            <div className="camera-controls">
              <button onClick={takePhoto} className="take-photo-btn">
                📷 Сделать фото
              </button>
              <button onClick={closeCamera} className="close-camera-btn">
                ✕ Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
