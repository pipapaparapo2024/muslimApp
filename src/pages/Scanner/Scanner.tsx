import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { Camera, TriangleAlert, Wallet, GalleryHorizontal } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import { openTelegramLink } from "@telegram-apps/sdk";

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
  const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { isLoading, processImage } = useScannerStore();
  const [showMediaOptions, setShowMediaOptions] = useState(false);

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

  // Функция для открытия камеры
  const openCamera = async () => {
    // Для Telegram пробуем открыть камеру через deep link
    if (window.Telegram?.WebApp) {
      try {
        openTelegramLink("tg://camera");
        // В Telegram после открытия камеры пользователь сам вернется в приложение
        // Обработка результата будет через другие механизмы
      } catch (error) {
        console.error("Error opening Telegram camera:", error);
        // Fallback на стандартный input
        cameraInputRef.current?.click();
      }
    } else {
      // Для браузера используем стандартный input
      cameraInputRef.current?.click();
    }
    setShowMediaOptions(false);
  };

  // Функция для открытия галереи (медиатеки)
  const openGallery = useCallback(() => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
    setShowMediaOptions(false);
  }, []);

  // Функция для открытия меню выбора (камера или галерея)
  const openMediaSelection = () => {
    const webApp = window.Telegram?.WebApp;
    
    if (webApp) {
      // В Telegram показываем popup с выбором
      // Убираем свойство id, так как его нет в типе
      webApp.showPopup({
        title: t("selectSource"),
        message: t("choosePhotoSource"),
        buttons: [
          { 
            type: 'default', 
            text: t("camera")
          },
          { 
            type: 'default', 
            text: t("gallery")
          },
          { 
            type: 'cancel'
          }
        ]
      });

      // В реальном приложении Telegram WebApp обрабатывает нажатия кнопок самостоятельно
      // Мы просто открываем камеру по умолчанию через небольшой таймаут
      setTimeout(() => {
        openCamera();
      }, 100);
    } else {
      // В браузере показываем свои кнопки
      setShowMediaOptions(true);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const showAskButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

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

        {/* Input для камеры */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Input для галереи */}
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Центральный контент */}
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

        {/* Кнопка сканирования */}
        <div className={styles.scanButtonContainer}>
          <button
            className={styles.submitButton}
            onClick={showAskButton ? openMediaSelection : () => setShowModal(true)}
            disabled={isLoading}
          >
            {showAskButton ? (
              <Camera strokeWidth={1.5} />
            ) : (
              <Wallet strokeWidth={1.5} />
            )}
            {getButtonText()}
          </button>
        </div>

        {/* Меню выбора источника фото (показывается только в браузере) */}
        {showMediaOptions && (
          <div className={styles.mediaOptionsOverlay}>
            <div className={styles.mediaOptions}>
              <h3>{t("selectSource")}</h3>
              <button
                className={styles.mediaOptionButton}
                onClick={openCamera}
              >
                <Camera size={24} />
                <span>{t("camera")}</span>
              </button>
              <button
                className={styles.mediaOptionButton}
                onClick={openGallery}
              >
                <GalleryHorizontal size={24} />
                <span>{t("gallery")}</span>
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowMediaOptions(false)}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
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