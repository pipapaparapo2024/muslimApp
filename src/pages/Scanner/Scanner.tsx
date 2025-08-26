import React, { useEffect, useState, useRef } from "react";
import WebApp from "@twa-dev/sdk";
import axios from "axios";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { useQnAStore } from "../QnA/QnAStore";
import {
  Camera,
  TriangleAlert,
  Wallet,
  X,
  Check,
  RotateCcw
} from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { TableRequestsHistory } from "../../components/TableRequestsHistory/TableRequestsHistory";

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = useQnAStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
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
    if (WebApp.platform !== 'unknown' && WebApp.showScanQrPopup) {
      // В Telegram - используем нативный сканер
      WebApp.showScanQrPopup({
        text: 'Наведите камеру на состав продукта',
      }, (result: string) => {
        if (result) {
          handleScanResult(result);
        }
      });
    } else {
      // В браузере - открываем камеру через input
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
    // Сбрасываем значение input для возможности повторного выбора того же файла
    if (event.target) {
      event.target.value = '';
    }
  };

  const processImageFile = async (file: File) => {
    setIsLoading(true);
    setScanResult(null);
    
    try {
      // Показываем превью фото
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Отправляем на бекенд
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'ingredients_scan');

      const response = await axios.post('/api/v1/scanner/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
      });

      setScanResult(response.data);

      WebApp.showAlert('Продукт успешно проанализирован!');

    } catch (error: any) {
      console.error('Ошибка при анализе изображения:', error);
      WebApp.showAlert(`Ошибка: ${error.response?.data?.message || 'Не удалось проанализировать изображение'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanResult = async (result: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/v1/scanner/analyze-text', {
        text: result,
        type: 'ingredients_scan'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setScanResult(response.data);

      WebApp.showAlert('Текст успешно проанализирован!');

    } catch (error: any) {
      console.error('Ошибка при анализе текста:', error);
      WebApp.showAlert(`Ошибка: ${error.response?.data?.message || 'Не удалось проанализировать текст'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setScanResult(null);
  };

  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return capturedImage ? "Analyzing..." : "Scan Picture";
    }
    return "Buy Requests";
  };

  const showAskButton = hasPremium || (requestsLeft != null && requestsLeft > 0);

  if (!imageLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true}>
      <div className={styles.container}>
        <TableRequestsHistory text="/scanner/historyScanner"/>

        {/* Скрытый input для камеры */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Центральный контент */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner />
              <p>Analyzing product...</p>
            </div>
          ) : capturedImage ? (
            <div className={styles.resultContainer}>
              <div className={styles.previewWrapper}>
                <img 
                  src={capturedImage} 
                  alt="Captured product" 
                  className={styles.previewImage}
                />
                {scanResult && (
                  <div className={styles.resultOverlay}>
                    <div className={`${styles.resultBadge} ${scanResult.isHalal ? styles.halal : styles.haram}`}>
                      {scanResult.isHalal ? (
                        <Check size={20} />
                      ) : (
                        <X size={20} />
                      )}
                      {scanResult.isHalal ? 'Halal' : 'Haram'}
                    </div>
                  </div>
                )}
              </div>

              {scanResult && (
                <div className={styles.resultDetails}>
                  <h3>Analysis Result</h3>
                  <div className={styles.ingredientsList}>
                    {scanResult.ingredients?.map((ingredient: string, index: number) => (
                      <div key={index} className={styles.ingredientItem}>
                        {ingredient}
                      </div>
                    ))}
                  </div>
                  {scanResult.explanation && (
                    <p className={styles.explanation}>{scanResult.explanation}</p>
                  )}
                </div>
              )}

              <div className={styles.resultActions}>
                <button 
                  className={styles.rescanButton}
                  onClick={resetScan}
                >
                  <RotateCcw size={16} />
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
                  Take a photo of the product's ingredients to check if it's halal
                  or haram. You'll get a quick result with a short explanation.
                </p>
                <p className={styles.warning}>
                  <TriangleAlert strokeWidth={1.5} size={18} color="white" fill="#F59E0B" />
                  The result is for informational purposes only.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Кнопка сканирования */}
        {!capturedImage && !isLoading && (
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