import React, { useEffect, useRef, useState } from "react";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useQnAStore } from "../../hooks/useQnAStore";
import { Camera, TriangleAlert, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { useScannerStore } from "../../hooks/useScannerStore";
import { useNavigate } from "react-router-dom";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRequests, setSelectedRequests] = useState("10");
  // Используем store сканера
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
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Сначала переходим на analyzing, затем обрабатываем
      navigate("/scanner/analyze");

      // Небольшая задержка для гарантии навигации
      setTimeout(async () => {
        try {
          await processImage(file);
        } catch (error) {
          console.error("Ошибка обработки:", error);
          // Ошибка обрабатывается в store, навигация произойдет автоматически
        }
      }, 100);
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return "Scan Picture";
    }
    return "Buy Requests";
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
    <PageWrapper showBackButton>
      <div className={styles.container}>
        <div className={styles.table}>
          <TableRequestsHistory text="/scanner/historyScanner" />
        </div>

        {/* Скрытый input для камеры */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Центральный контент */}
        <div className={styles.content}>
          <div className={styles.illustration}>
            <img src={scanner} alt="Instant Halal Check" />
          </div>

          <div className={styles.halalCheck}>
            <span>Instant Halal Check</span>
            <p>
              Take a photo of the product's ingredients to check if it's halal
              or haram. You'll get a quick result with a short explanation.
            </p>
            <p className={styles.warning}>
              <TriangleAlert
                strokeWidth={1.5}
                size={18}
                color="white"
                fill="#F59E0B"
              />
              The result is for informational purposes only.
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
