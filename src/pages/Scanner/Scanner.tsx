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
import React, { useState, useCallback, useRef } from "react";

interface PhotoData {
  uri: string;
  base64?: string;
  type: string;
  name: string;
}

interface TelegramWebApp {
  WebApp?: {
    showPopup: (params: {
      title: string;
      message: string;
      buttons: Array<{ type: string; text?: string }>;
    }) => void;
    showAlert: (message: string) => void;
    showConfirm: (
      title: string,
      message: string,
      callback: (result: boolean) => void
    ) => void;
    openTelegramLink: (url: string) => void;
    platform: string;
    version: string;
    initDataUnsafe?: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
      };
    };
  };
}

declare global {
  interface Window {
    Telegram?: TelegramWebApp;
  }
}

export const Scanner: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cameraVisible, setCameraVisible] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Ваш браузер не поддерживает доступ к камере");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Освобождаем поток сразу после проверки разрешения
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Ошибка доступа к камере:", error);
      alert("Не удалось получить доступ к камере. Проверьте разрешения.");
      return false;
    }
  }, []);

  const handlePhotoTaken = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const photoData: PhotoData = {
        uri: URL.createObjectURL(file),
        base64: event.target?.result as string,
        type: file.type,
        name: file.name,
      };

      console.log("Фото сделано:", photoData);

      // Вместо sendData используем другой метод или просто логируем
      if (window.Telegram?.WebApp) {
        // Альтернатива: показываем popup с информацией о фото
        window.Telegram.WebApp.showPopup({
          title: "Фото сделано",
          message: `Фото "${file.name}" успешно обработано`,
          buttons: [{ type: "ok" }],
        });

        // Или используем showAlert
        // window.Telegram.WebApp.showAlert('Фото успешно обработано!');
      }
    };
    reader.readAsDataURL(file);
  }, []);

const openCamera = useCallback(async () => {
  setIsLoading(true);

  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
      alert('Функция камеры доступна только на мобильных устройствах');
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    // Создаем input для камеры с явным указанием типа
    const input = document.createElement('input') as HTMLInputElement;
    input.type = 'file';
    input.accept = 'image/*';
    
    // Используем setAttribute правильно
    input.setAttribute('capture', 'camera');
    
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files[0]) {
        handlePhotoTaken(files[0]);
      }
    };

    input.click();
    
  } catch (error) {
    console.error('Ошибка при открытии камеры:', error);
    alert('Не удалось открыть камеру');
  } finally {
    setIsLoading(false);
  }
}, [requestCameraPermission, handlePhotoTaken]);

  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files[0]) {
        handlePhotoTaken(files[0]);
      }
    },
    [handlePhotoTaken]
  );

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <button
        onClick={openCamera}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? "#6c757d" : "#0088cc",
          color: "white",
          padding: "15px 25px",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: isLoading ? "not-allowed" : "pointer",
          margin: "10px",
          minWidth: "200px",
          transition: "background-color 0.2s ease",
        }}
        onMouseOver={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "#0066a4";
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "#0088cc";
          }
        }}
      >
        {isLoading ? (
          <>
            <span style={{ marginRight: "8px" }}>⏳</span>
            Загрузка...
          </>
        ) : (
          <>
            <span style={{ marginRight: "8px" }}>📷</span>
            Открыть камеру
          </>
        )}
      </button>

      <button
        onClick={openFilePicker}
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "15px 25px",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          margin: "10px",
          minWidth: "200px",
          transition: "background-color 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#218838";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#28a745";
        }}
      >
        <span style={{ marginRight: "8px" }}>🖼️</span>
        Выбрать из галереи
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {cameraVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "black",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              onClick={() => setCameraVisible(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
