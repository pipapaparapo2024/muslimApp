import React, { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import styles from "./Scanner.module.css";
import { useQnAStore } from "../QnA/QnAStore";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { quranApi } from "../../api/api";
import { ScannerLayout } from "./scannerBlock/ScannerLayout";
import { ScannerContent } from "./scannerBlock/ScannerContent";
import { ScannerActions } from "./scannerBlock/ScannerActions";
import { ScannerFileInput } from "./scannerBlock/ScannerFileInput";
import { PageWrapper } from "../../shared/PageWrapper";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const openCamera = () => {
    // Функционал открытия камеры будет реализован через ScannerFileInput
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
    <ScannerLayout>
      <ScannerFileInput onFileSelect={handleFileSelect} />
      
      <div className={styles.content}>
        <ScannerContent
          showAnalyzing={showAnalyzing}
          scanResult={scanResult}
          capturedImage={capturedImage}
          onRescan={resetScan}
        />
      </div>

      <ScannerActions
        showAskButton={showAskButton}
        isLoading={isLoading}
        onOpenCamera={openCamera}
        onOpenModal={() => setShowModal(true)}
        buttonText={getButtonText()}
      />

      <BuyRequestsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedRequests={selectedRequests}
        onSelectRequests={setSelectedRequests}
      />
    </ScannerLayout>
  );
};

