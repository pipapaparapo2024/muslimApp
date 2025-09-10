import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { openTelegramLink } from "@telegram-apps/sdk";

// Типы для результата сканирования (скопированы из Svelte)
interface ScanFoodResponse {
  verdict_en: "kosher" | "not kosher" | "undetermined";
  recognized_ingredients_en?: string[];
  explanations?: Record<string, {
    reason_en: string;
    source_en: string;
  }>;
}

export const Scanner: React.FC = () => {
  const { requestsLeft, hasPremium, fetchUserData } = usePremiumStore();
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { isLoading: isProcessing, processImage } = useScannerStore();

  // Состояния, скопированные из Svelte
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanFoodResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Предзагрузка изображения
  useEffect(() => {
    const img = new Image();
    img.src = scanner;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      console.error("Failed to load scanner image:", scanner);
      setImageLoaded(true);
    };
  }, []);

  // Обработка URL-параметров (если пришли от бота)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageId = urlParams.get('image_id');
    const sessionId = urlParams.get('session_id');

    if (imageId && sessionId) {
      const currentSession = localStorage.getItem('currentSessionId');
      if (currentSession === sessionId) {
        handleImageFromBot(imageId);
        localStorage.removeItem('currentSessionId');
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Обработка изображения, полученного через бота
  const handleImageFromBot = async (imageId: string) => {
    try {
      // Загружаем изображение по image_id с вашего бэкенда
      const response = await fetch(`/api/images/${imageId}`);
      if (!response.ok) throw new Error("Failed to load image");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);

      // Имитируем обработку через processImage
      await simulateProcessImage(blob);
    } catch (error) {
      setErrorMsg(t("cameraUnavailable"));
      console.error("Ошибка загрузки изображения от бота:", error);
    }
  };

  // Симуляция processImage — адаптируйте под вашу логику
  const simulateProcessImage = async (blob: Blob) => {
    setIsUploading(true);
    setErrorMsg("");

    try {
      // Создаём File из Blob
      const file = new File([blob], "capture.jpeg", { type: "image/jpeg" });

      // Используем ваш существующий processImage
      const scanResult = await processImage(file); // ← Должен возвращать ScanFoodResponse

      // Если processImage не возвращает данные — закомментируйте и используйте мок:
      // const scanResult = { verdict_en: "kosher" } as ScanFoodResponse;

      setResult(scanResult);
      setResponseOpen(true);
    } catch (error) {
      setErrorMsg(t("scanError"));
      console.error("Ошибка сканирования:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = () => {
    if (isAndroid && window.Telegram?.WebApp) {
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('currentSessionId', sessionId);
      openTelegramLink(`tg://camera?startattach=1&bot_username=funnyTestsBot`);
      alert(t("takePhotoAndSendToBot"));
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("onlyImagesAllowed"));
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Сбрасываем input
    if (event.target) event.target.value = "";

    await simulateProcessImage(file);
  };

  const retake = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setResult(null);
    setResponseOpen(false);
    // Для iOS/Desktop — снова открываем камеру через input
    if (!isAndroid || !window.Telegram?.WebApp) {
      cameraInputRef.current?.click();
    } else {
      openCamera(); // Для Android — снова через tg://camera
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

        {/* Input для iOS/Desktop */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Фон: видео или изображение */}
        <div className={styles.cameraBackground}>
          {!imageUrl && (
            <div className={styles.cameraPlaceholder}>
              <img src={scanner} alt={t("instantHalalCheck")} />
              <p>{t("pointCameraAtLabel")}</p>
            </div>
          )}
          {imageUrl && (
            <img src={imageUrl} alt="Captured" className={styles.capturedImage} />
          )}
        </div>

        {/* Кнопки управления */}
        <div className={styles.actionBar}>
          <button
            className={styles.iconButton}
            onClick={() => setOpenAbout(true)}
            disabled={isProcessing}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className={`${styles.captureButton} ${isUploading ? styles.loading : ''}`}
            onClick={imageUrl ? retake : (showAskButton ? openCamera : () => setShowModal(true))}
            disabled={isProcessing}
          >
            {isUploading ? (
              <div className={styles.spinner} />
            ) : imageUrl ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L9 16L19 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <Camera strokeWidth={1.5} />
            )}
          </button>

          <button
            className={styles.iconButton}
            onClick={() => setOpenHistory(true)}
            disabled={isProcessing}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Модальное окно результата */}
        {responseOpen && (
          <div className={styles.modalOverlay} onClick={() => setResponseOpen(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              {result?.verdict_en === 'kosher' && (
                <>
                  <div className={styles.resultIcon}>✅</div>
                  <div className={styles.resultText}>{t("kosherFood")}</div>
                </>
              )}
              {result?.verdict_en === 'not kosher' && (
                <>
                  <div className={styles.resultIcon}>❌</div>
                  <div className={styles.resultText}>{t("notKosherFood")}</div>
                </>
              )}
              {result?.verdict_en === 'undetermined' && (
                <>
                  <div className={styles.resultIcon}>❓</div>
                  <div className={styles.resultText}>{t("undetermined")}</div>
                </>
              )}

              <div className={styles.resultDetails}>
                {result?.recognized_ingredients_en && (
                  <div className={styles.ingredients}>
                    {result.recognized_ingredients_en.join(', ')}
                  </div>
                )}
                {result?.explanations && Object.keys(result.explanations).map(key => {
                  const exp = result.explanations![key];
                  const title = key.split(' / ')[1] || key;
                  return (
                    <div key={key} className={styles.explanation}>
                      <strong>{title}</strong>: {exp.reason_en.replace(';', ', ')}
                      {exp.source_en && exp.source_en !== 'n/a' && (
                        <div className={styles.source}>
                          {exp.source_en.replace(';', ', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.modalButtonPrimary} onClick={retake}>
                  {t("thanks")}
                </button>
                <button className={styles.modalButtonSecondary} onClick={() => {
                  // Ваша функция для приглашения друга
                  const telegramId = window.Telegram?.WebApp.initDataUnsafe.user?.id;
                  if (telegramId) {
                    const shareUrl = `https://t.me/funnyTestsBot?start=ref-${telegramId}`;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      alert(t("linkCopiedToClipboard"));
                    });
                  }
                }}>
                  {t("share")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно "О приложении" */}
        {openAbout && (
          <div className={styles.modalOverlay} onClick={() => setOpenAbout(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div className={styles.aboutContent}>
                <div className={styles.aboutIcon}>🤖</div>
                <h3>{t("aiFoodScanner")}</h3>
                <p>{t("scannerDescription")}</p>
                <button className={styles.modalButtonPrimary} onClick={() => setOpenAbout(false)}>
                  {t("thanks")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно истории (заглушка) */}
        {openHistory && (
          <div className={styles.modalOverlay} onClick={() => setOpenHistory(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h3>{t("scanHistory")}</h3>
              <div className={styles.historyList}>
                {/* Здесь должен быть компонент истории */}
                <p>{t("historyComingSoon")}</p>
              </div>
              <button className={styles.modalButtonPrimary} onClick={() => setOpenHistory(false)}>
                {t("close")}
              </button>
            </div>
          </div>
        )}

        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        {/* Подсказка для Android */}
        {isAndroid && !imageUrl && <div className={styles.tip}>{t("androidCameraTip")}</div>}
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