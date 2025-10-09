import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, RotateCcw, Send } from "lucide-react";
import { useScannerStore } from "../../../hooks/useScannerStore";
import styles from "./CameraPage.module.css";
import { PageWrapper } from "../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { useTranslationsStore } from "../../../hooks/useTranslations";
import { trackButtonClick } from "../../../api/analytics";

export const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const { processImage, isLoading, resetScannerState } = useScannerStore();
  const { translations } = useTranslationsStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      setCameraError("Не удалось получить доступ к камере");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL("image/png");
      setPhotoPreview(photoData);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhotoPreview(null);
    startCamera();
  };

  const handleProcessPhoto = async () => {
    if (photoPreview) {
      try {
        resetScannerState();

        const response = await fetch(photoPreview);
        const blob = await response.blob();
        const file = new File([blob], "scanned-image.png", {
          type: "image/png",
        });
        trackButtonClick("food_scan","click_scan_picture")
        navigate("/scanner/analyze");

        setTimeout(async () => {
          try {
            await processImage(file);
          } catch (error) {
            console.error("Ошибка обработки:", error);
          }
        }, 100);
      } catch (error) {
        console.error("Ошибка конвертации фото:", error);
      }
    }
  };
  if (isLoading)
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  if (photoPreview) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner">
        <div className={styles.cameraContainer}>
          <div className={styles.previewContainer}>
            <img
              src={photoPreview}
              alt="Preview"
              className={styles.previewImage}
            />
          </div>

          <div className={styles.controls}>
            <button onClick={retakePhoto} className={styles.againButton}>
              <RotateCcw size={20} />
              {translations?.again}
            </button>
            <button
              onClick={handleProcessPhoto}
              className={styles.sendButton}
              disabled={isLoading}
            >
              <Send size={20} />
              {translations?.send}
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} navigateTo="/scanner">
      <div className={styles.cameraContainer}>
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.videoElement}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {cameraError && (
            <div className={styles.errorMessage}>{cameraError}</div>
          )}
        </div>

        <div className={styles.captureButtonContainer}>
          <button onClick={takePhoto} className={styles.captureButton}>
            <Camera size={32} />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
