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

import React from 'react';

interface CameraButtonProps {
  onPhotoTaken?: (photo: string) => void;
  buttonText?: string;
}

export const Scanner: React.FC<CameraButtonProps> = ({
  onPhotoTaken,
  buttonText = "📷 Открыть камеру"
}) => {
  const openCamera = () => {
    // Проверяем, что мы в Telegram WebApp
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Для Telegram WebApp используем стандартный input с атрибутом capture
      // так как прямого API для камеры может не быть
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Используем основную камеру
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onPhotoTaken) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onPhotoTaken(event.target?.result as string);
            webApp.showAlert("Фото сделано успешно!");
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } else {
      // Если не в Telegram, используем стандартный input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'camera';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onPhotoTaken) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onPhotoTaken(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    }
  };

  return (
    <button
      onClick={openCamera}
      style={{
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '160px',
        justifyContent: 'center'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#0056b3';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#007bff';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
    >
      <span style={{ fontSize: '18px' }}>📷</span>
      {buttonText}
    </button>
  );
};