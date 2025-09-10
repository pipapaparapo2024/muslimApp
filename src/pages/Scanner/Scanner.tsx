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
import React, { useState, useRef } from 'react';

interface CameraButtonProps {
  onPhotoTaken?: (photoData: string) => void;
}

export const Scanner: React.FC<CameraButtonProps> = ({ onPhotoTaken }) => {
  // const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = () => {
    if (isMobileDevice()) {
      // Для мобильных устройств используем input с камерой
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      // Для десктопа или если камера не доступна
      alert('Камера доступна только на мобильных устройствах');
    }
  };

  const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setPhotoPreview(photoData);
        onPhotoTaken?.(photoData);
      };
      
      reader.readAsDataURL(file);
    }
    
    // Сбрасываем значение input для возможности повторного выбора того же файла
    if (event.target) {
      event.target.value = '';
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
  };

  return (
    <div className="camera-container">
      {/* Скрытый input для камеры */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Используем заднюю камеру
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {photoPreview ? (
        <div className="photo-preview">
          <img src={photoPreview} alt="Предпросмотр" className="preview-image" />
          <button onClick={clearPhoto} className="retake-button">
            Сделать новое фото
          </button>
        </div>
      ) : (
        <button onClick={openCamera} className="camera-button">
          📷 Открыть камеру
        </button>
      )}
    </div>
  );
};
