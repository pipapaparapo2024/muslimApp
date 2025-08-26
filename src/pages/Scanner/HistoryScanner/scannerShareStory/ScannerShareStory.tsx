import React, { useEffect, useState } from "react";
import styles from "./ScannerShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../HistoryScannerStore";
import { useScreenshot } from "../../../../components/useScreenshot/useScreenshot";
import { CircleCheck, CircleX, Upload } from "lucide-react";

export const ScannerShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { history } = useHistoryStore();

  const { createScreenshot, shareToTelegramStory, loading, imageRef } =
    useScreenshot();

  const currentItem = history.find((item) => item.id === id);

  useEffect(() => {
    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          resolve();
        };
      });
    };

    preloadImage(message)
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Error during image preloading:", err);
        setIsLoaded(true);
      });
  }, []);

  const handleShare = async () => {
    try {
      const imageUrl = await createScreenshot();
      await shareToTelegramStory(imageUrl);
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true}>
        <div>Запрос не найден</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false}>
      <div className={styles.container}>
        <div className={styles.contentWrapper} ref={imageRef}>
          <img src={message} alt="Message background" />
          <div className={styles.blockScan}>
            <div className={styles.blockAccess}>
              {currentItem.result == true ? (
                <div className={`${styles.accessBlock} ${styles.haram}`}>
                  <CircleX size={24} strokeWidth={1.5} /> Haram
                </div>
              ) : (
                <div className={`${styles.accessBlock} ${styles.halal}`}>
                  <CircleCheck size={24} strokeWidth={1.5} />
                  Halal
                </div>
              )}
            </div>
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>Ingredients</div>
              <div className={styles.scanDesk}>{currentItem.composition}</div>
            </div>
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>Analysis Result</div>
              <div className={styles.scanDesk}>{currentItem.analysis}</div>
            </div>
            <button
              type="button"
              onClick={handleShare}
              disabled={loading}
              className={`${styles.shareButton} ${
                loading ? styles.shareButtonDisabled : ""
              }`}
            >
              <Upload /> {loading ? "Loading..." : "Share"}
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
