import React, { useEffect, useRef, useState } from "react";
import styles from "./Scanner.module.css";
import { PageWrapper } from "../../shared/PageWrapper";
import { usePremiumStore } from "../../hooks/usePremiumStore";
import { Camera, TriangleAlert, Wallet } from "lucide-react";
import { BuyRequestsModal } from "../../components/modals/modalBuyReqeuests/ModalBuyRequests";
import scanner from "../../assets/image/scanner.png";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
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

  // --- СОСТОЯНИЯ ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [facingMode] = useState<"user" | "environment">("environment");
  const [isUploading, setIsUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false); // Новое состояние для отслеживания готовности камеры

  // --- ФУНКЦИИ ---
  const startCamera = async () => {
    setErrorMsg("");
    setImageUrl(null);
    setStarting(true);
    setCameraReady(false); // Сбрасываем готовность камеры

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

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        
        // Ждем пока видео будет готово к воспроизведению
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Камера недоступна");
      stopCamera();
    } finally {
      setStarting(false);
    }
  };

  // Обработчик события, когда видео готово к воспроизведению
  const handleVideoCanPlay = () => {
    setCameraReady(true);
  };

  // Обработчик ошибок видео
  const handleVideoError = () => {
    setErrorMsg("Ошибка загрузки видео");
    setCameraReady(false);
    setCameraActive(false);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const handleScanClick = async () => {
    if (cameraActive) {
      await capture();
    } else {
      await startCamera();
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
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

      canvas.toBlob(async (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          stopCamera();
          await upload(blob);
        }
      }, "image/jpeg", 0.92);
    } else {
      setErrorMsg("Камера не готова. Попробуйте еще раз.");
    }
  };

  const upload = async (imageBlob: Blob) => {
    setIsUploading(true);
    setErrorMsg("");

    try {
      const imageFile = new File([imageBlob], "capture.jpeg", { type: "image/jpeg" });
      await processImage(imageFile);
      navigate("/scanner/analyze");
    } catch (e: any) {
      const errorMessage = e?.message || "Ошибка сканирования. Пожалуйста, попробуйте позже.";
      setErrorMsg(errorMessage);
      console.error("Upload error:", e);
      
      // Даем возможность повторить
      setImageUrl(null);
      setCameraActive(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBuyRequests = () => {
    setShowModal(true);
  };

  // --- HOOKS ---
  useEffect(() => {
    fetchUserData();
    return () => stopCamera();
  }, []);

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
      if (starting) return t("startingCamera");
      if (cameraActive && !cameraReady) return t("cameraLoading");
      return cameraActive ? t("scanPicture") : t("startCamera");
    }
    return t("buyRequests");
  };

  const showScanButton = hasPremium || (requestsLeft != null && requestsLeft > 0);
  const isButtonDisabled = isLoading || starting || isUploading || (cameraActive && !cameraReady);

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
        {/* Контейнер камеры/превью */}
        {cameraActive && (
          <div className={styles.cameraContainer}>
            <video
              ref={videoRef}
              className={`${styles.videoElement} ${imageUrl ? styles.hidden : ''}`}
              playsInline
              muted
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Capture preview"
                className={styles.previewImage}
              />
            )}
            {(starting || (cameraActive && !cameraReady)) && (
              <div className={styles.cameraLoading}>
                <LoadingSpinner /> 
                {starting ? "Запуск камеры..." : "Камера загружается..."}
              </div>
            )}
          </div>
        )}

        {/* Центральный контент */}
        {!cameraActive && !imageUrl && (
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

        {/* Кнопка */}
        <div className={styles.scanButtonContainer}>
          <button
            className={styles.submitButton}
            onClick={showScanButton ? handleScanClick : handleBuyRequests}
            disabled={isButtonDisabled}
          >
            {(starting || isUploading || (cameraActive && !cameraReady)) ? (
              <LoadingSpinner />
            ) : showScanButton ? (
              <Camera size={24} />
            ) : (
              <Wallet size={24} />
            )}
            {getButtonText()}
          </button>
        </div>

        {/* Отображение ошибок */}
        {errorMsg && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{errorMsg}</p>
            <button
              className={styles.retryButton}
              onClick={() => {
                setErrorMsg("");
                stopCamera();
                setImageUrl(null);
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Скрытый canvas */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
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