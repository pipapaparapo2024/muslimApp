import React, { useEffect, useRef, useState } from "react";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { Camera, TriangleAlert, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { isLoading, processImage } = useScannerStore();
  const [selectedRequests, setSelectedRequests] = useState("10");
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const img = new Image();
    img.src = scanner;

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load scanner image:", scanner);
      setImageError(true);
      setImageLoaded(true);
    };
  }, []);

  // Функция открытия камеры из первого кода
  const openCamera = async () => {
    try {
      setIsCameraOpen(true);
      setCameraError('');

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
      setIsCameraOpen(false);
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

    setIsCameraOpen(false);
  };

  const takePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context && videoRef.current.videoWidth > 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Конвертируем canvas в Blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          // Создаем File из Blob
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          
          // Закрываем камеру
          closeCamera();
          
          // Переходим на страницу анализа
          navigate("/scanner/analyze");

          // Обрабатываем изображение
          setTimeout(async () => {
            try {
              await processImage(file);
            } catch (error) {
              console.error('Ошибка обработки:', error);
            }
          }, 100);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      navigate("/scanner/analyze");

      setTimeout(async () => {
        try {
          await processImage(file);
        } catch (error) {
          console.error("Ошибка обработки:", error);
        }
      }, 100);
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return t("scanPicture");
    }
    return t("buyRequests");
  };

  const showAskButton = hasPremium || (requestsLeft != null && requestsLeft > 0);

  if (!imageLoaded) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton navigateTo="/home">
      <div className={styles.container}>
        <div className={styles.table}>
          <TableRequestsHistory text="/scanner/historyScanner" />
        </div>

        {/* Модальное окно камеры */}
        {isCameraOpen && (
          <div className={styles.cameraModal}>
            <div className={styles.cameraContainer}>
              <video 
                ref={videoRef}
                className={styles.cameraPreview}
                playsInline
                autoPlay
                muted
              />
              
              {cameraError && (
                <div className={styles.errorMessage}>
                  {cameraError}
                  <button onClick={openCamera} className={styles.retryButton}>
                    Повторить
                  </button>
                </div>
              )}

              <div className={styles.cameraControls}>
                <button onClick={takePhoto} className={styles.takePhotoBtn}>
                  📷 Сделать фото
                </button>
                <button onClick={closeCamera} className={styles.closeCameraBtn}>
                  ✕ Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Основной контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={scanner} alt={t("instantHalalCheck")} />
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

        {/* Кнопки сканирования */}
        <div className={styles.scanButtonContainer}>
          {showAskButton ? (
            <>
              <button
                className={styles.submitButton}
                onClick={openCamera}
                disabled={isLoading}
              >
                <Camera strokeWidth={1.5} />
                {t("scanWithCamera")}
              </button>
              
              <button
                className={styles.submitButtonSecondary}
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={isLoading}
              >
                <Wallet strokeWidth={1.5} />
                {t("chooseFromGallery")}
              </button>
            </>
          ) : (
            <button
              className={styles.submitButton}
              onClick={() => setShowModal(true)}
              disabled={isLoading}
            >
              <Wallet strokeWidth={1.5} />
              {t("buyRequests")}
            </button>
          )}
          
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
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




