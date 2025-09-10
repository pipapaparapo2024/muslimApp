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
  const [facingMode, ] = useState<"user" | "environment">("environment");
  const [, setIsUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraActive, setCameraActive] = useState(false); // Новое состояние для управления камерой

  // --- ФУНКЦИИ ---
  const startCamera = async () => {
    setErrorMsg("");
    setImageUrl(null);
    setStarting(true);
    setCameraActive(true);

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
        await videoRef.current.play();
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Камера недоступна");
      stopCamera();
      setCameraActive(false);
    } finally {
      setStarting(false);
    }
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
  };

  const handleScanClick = () => {
    if (cameraActive) {
      capture();
    } else {
      startCamera();
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

      canvas.toBlob(async (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          stopCamera();
          await upload(blob);
        }
      }, "image/jpeg", 0.92);
    } else {
      setErrorMsg("Camera not ready, try again.");
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
      const errorMessage = e?.message || "Ошибка сканирования :( повторите позже";
      setErrorMsg(errorMessage);
      console.error("Upload error:", e);
    } finally {
      setIsUploading(false);
    }
  };

  // --- HOOKS ---
  useEffect(() => {
    fetchUserData();
    // Убрали автоматический запуск камеры
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
      return cameraActive ? t("scanPicture") : t("startCamera");
    }
    return t("buyRequests");
  };

  const showScanButton = hasPremium || (requestsLeft != null && requestsLeft > 0);

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
        {/* Контейнер камеры/превью (только когда активна) */}
        {cameraActive && (
          <div className={styles.cameraContainer}>
            <video
              ref={videoRef}
              className={`${styles.videoElement} ${imageUrl ? styles.hidden : ''}`}
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
        )}

        {/* Центральный контент (показываем когда камера не активна) */}
        {!cameraActive && (
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

        {/* Кнопка сканирования/запуска камеры */}
        <div className={styles.scanButtonContainer}>
          <button
            className={styles.submitButton}
            onClick={showScanButton ? handleScanClick : () => setShowModal(true)}
            disabled={isLoading || starting}
          >
            {showScanButton ? (
              <Camera size={24} />
            ) : (
              <Wallet size={24} />
            )}
            {getButtonText()}
          </button>
        </div>

        {/* Отображение ошибок */}
        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

        {/* Скрытый canvas для захвата кадра */}
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