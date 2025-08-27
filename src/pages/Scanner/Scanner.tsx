import React, { useEffect, useState, useRef } from "react";
import WebApp from "@twa-dev/sdk";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useQnAStore } from "../QnA/QnAStore";
import { Camera, TriangleAlert, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";
import { AnalyzingIngredient } from "./AnalyzingIngredient";
import { HistoryScannerDetail } from "../Scanner/HistoryScanner/historyScannerDetail/HistoryScannerDetail";
import { quranApi } from "../../api/api";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await processImageFile(file);
    }
    // Сбрасываем значение input для возможности повторного выбора того же файла
    if (event.target) {
      event.target.value = "";
    }
  };

  const processImageFile = async (file: File) => {
    setIsLoading(true);
    setShowAnalyzing(true);
    setMinLoadingTimePassed(false);
    setScanResult(null);

    // Устанавливаем минимальное время показа AnalyzingIngredient (2 секунды)
    setTimeout(() => setMinLoadingTimePassed(true), 2000);

    try {
      // Показываем превью фото
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Отправляем на бекенд
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "ingredients_scan");

      const response = await quranApi.post(
        "/api/v1/scanner/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setScanResult(response.data);

      // Ждем пока пройдет минимум 2 секунды перед показом результата
      const waitForMinTime = () => {
        if (minLoadingTimePassed) {
          setShowAnalyzing(false);
          WebApp.showAlert("Продукт успешно проанализирован!");
        } else {
          setTimeout(waitForMinTime, 100);
        }
      };
      waitForMinTime();
    } catch (error: any) {
      console.error("Ошибка при анализе изображения:", error);
      setShowAnalyzing(false);
      WebApp.showAlert(
        `Ошибка: ${
          error.response?.data?.message ||
          "Не удалось проанализировать изображение"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setScanResult(null);
    setShowAnalyzing(false);
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
          {showAnalyzing ? (
            <AnalyzingIngredient />
          ) : scanResult ? (
            <HistoryScannerDetail isScan={true} result={scanResult} />
          ) : capturedImage ? (
            <div className={styles.resultContainer}>
              <div className={styles.resultActions}>
                <button
                  className={styles.rescanButton}
                  onClick={() => {
                    resetScan;
                  }}
                >
                  <Camera size={16} />
                  Scan Again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.illustration}>
                <img src={scanner} alt="Instant Halal Check" />
              </div>

              <div className={styles.halalCheck}>
                <span>Instant Halal Check</span>
                <p>
                  Take a photo of the product's ingredients to check if it's
                  halal or haram. You'll get a quick result with a short
                  explanation.
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
            </>
          )}
        </div>

        {/* Кнопка сканирования */}
        {!capturedImage && !isLoading && !showAnalyzing && !scanResult && (
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
