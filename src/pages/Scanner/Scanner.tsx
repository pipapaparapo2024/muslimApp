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
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null); // Один input для всех устройств
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { isLoading, processImage } = useScannerStore();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Предзагрузка изображения scanner
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

  const openCamera = () => {
    cameraInputRef.current?.click();
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

        {/* Единый input для всех устройств с камерой */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment" 
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={scanner} alt={t("instantHalalCheck")} />
          </div>

          <div className={styles.halalCheck}>
            <span>Instant Halal Check</span>
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
            onClick={showAskButton ? openCamera : () => setShowModal(true)}
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