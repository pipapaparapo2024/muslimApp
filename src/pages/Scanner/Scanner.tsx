import React, { useEffect, useRef, useState } from "react";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import {
  Camera,
  TriangleAlert,
  Wallet,
  RotateCcw,
  Info,
  History,
} from "lucide-react"; // Добавлены иконки
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
  const navigate = useNavigate();
  const [selectedRequests, setSelectedRequests] = useState("10");
  const { isLoading, processImage } = useScannerStore();

  // --- СОСТОЯНИЯ ИЗ SVELTE КОДА ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- ФУНКЦИИ ИЗ SVELTE КОДА (адаптированы) ---
  const startCamera = async () => {
    setErrorMsg("");
    setImageUrl(null);
    setStarting(true);

    try {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Камера недоступна");
      stopCamera();
    } finally {
      setStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;

    if (w && h) {
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
            stopCamera();
            await upload(blob);
          }
        },
        "image/jpeg",
        0.92
      );
    } else {
      setErrorMsg("Camera not ready, try again.");
    }
  };

  const upload = async (imageBlob: Blob) => {
    setIsUploading(true);
    setErrorMsg("");

    try {
      // Создаем FormData и добавляем файл
      const formData = new FormData();
      const imageFile = new File([imageBlob], "capture.jpeg", {
        type: "image/jpeg",
      });
      formData.append("image", imageFile);

      // Если processImage ожидает File, передаем imageFile
      // Если ожидает FormData, передаем formData
      await processImage(imageFile); // ИЛИ formData, в зависимости от того что ожидает processImage
      // Если processImage не выбрасывает ошибку, считаем успешным
      // Перенаправление на экран анализа, если нужно
      navigate("/scanner/analyze");
    } catch (e: any) {
      const errorMessage =
        e?.message || "Ошибка сканирования :( повторите позже";
      setErrorMsg(errorMessage);
      // Здесь можно добавить вызов уведомления, если есть система нотификаций
      console.error("Upload error:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // --- HOOKS ---
  useEffect(() => {
    fetchUserData();
    startCamera(); // Запускаем камеру сразу при монтировании
    return () => stopCamera(); // Останавливаем камеру при размонтировании
  }, [facingMode]); // Перезапускаем камеру при смене facingMode

  useEffect(() => {
    const img = new Image();
    img.src = scanner;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      console.error("Failed to load image");
      setImageLoaded(true);
    };
  }, []);

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
  const getButtonText = () => {
    if (hasPremium || (requestsLeft != null && requestsLeft > 0)) {
      return t("scanPicture");
    }
    return t("buyRequests");
  };

  const showScanButton =
    hasPremium || (requestsLeft != null && requestsLeft > 0);

  if (!imageLoaded) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  // --- RENDER ---
  return (
    <PageWrapper showBackButton navigateTo="/home">
      <div className={styles.container}>
        <div className={styles.table}>
          <TableRequestsHistory text="/scanner/historyScanner" />
        </div>

        {/* Контейнер камеры/превью */}
        <div className={styles.cameraContainer}>
          <video
            ref={videoRef}
            className={`${styles.videoElement} ${
              imageUrl ? styles.hidden : ""
            }`}
            playsInline
            muted
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Capture preview"
              className={styles.previewImage}
            />
          )}
          {starting && (
            <div className={styles.cameraLoading}>
              <LoadingSpinner /> Init camera…
            </div>
          )}
        </div>

        {/* Центральный контент (скрываем при съемке) */}
        {!imageUrl && !starting && (
          <div className={styles.content}>
            <div className={styles.illustration}>
              <img src={scanner} alt={t("instantHalalCheck")} />
            </div>
            <div className={styles.halalCheck}>
              <span>{t("instantHalalCheck")}</span>
              <p>{t("takePhotoCheck")}</p>
              <p className={styles.warning}>
                <TriangleAlert size={18} />
                {t("informationalOnly")}
              </p>
            </div>
          </div>
        )}

        {/* Нижняя панель управления (как в Svelte) */}
        <div className={styles.controlBar}>
          {/* Кнопка Инфо (заглушка) */}
          <button
            className={styles.controlButton}
            onClick={() => alert("About modal")}
            disabled={starting}
          >
            <Info size={24} />
          </button>

          {/* Центральная кнопка */}
          <div className={styles.mainButtonContainer}>
            {!imageUrl && showScanButton && (
              <button
                className={styles.captureButton}
                onClick={capture}
                disabled={starting || isUploading}
              >
                <Camera size={32} />
              </button>
            )}
            {imageUrl && isUploading && (
              <div className={styles.captureButton}>
                <LoadingSpinner />
              </div>
            )}
            {/* Кнопка "Еще раз" можно добавить после обработки ошибки */}
          </div>

          {/* Кнопка История (заглушка) */}
          <button
            className={styles.controlButton}
            onClick={() => alert("History modal")}
            disabled={starting}
          >
            <History size={24} />
          </button>
        </div>

        {/* Кнопка смены камеры */}
        {!imageUrl && stream && (
          <button
            className={styles.switchCameraButton}
            onClick={switchCamera}
            disabled={starting}
          >
            <RotateCcw size={20} />
          </button>
        )}

        {/* Отображение ошибок */}
        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

        {/* Скрытый canvas для захвата кадра */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Модальное окно для покупки, если нет запросов */}
        {!showScanButton && (
          <div className={styles.scanButtonContainer}>
            <button
              className={styles.submitButton}
              onClick={() => setShowModal(true)}
              disabled={isLoading}
            >
              <Wallet strokeWidth={1.5} />
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
