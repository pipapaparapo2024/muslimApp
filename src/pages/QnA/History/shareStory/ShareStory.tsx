import React, { useEffect, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../HistoryStore";
import { useScreenshot } from "../../../../hooks/useScreenshot/useScreenshot";
import { Upload } from "lucide-react";

export const ShareStory: React.FC = () => {
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
          <img
            src={message}
            className={styles.messageImage}
            alt="Message background"
          />
          <div className={styles.blockMessages}>
            <div className={styles.blockMessageUser}>
              <div className={styles.nickName}>You</div>
              <div className={styles.text}>{currentItem.question}</div>
            </div>
            <div className={styles.blockMessageBot}>
              <div className={styles.nickName}>@MuslimBot</div>
              <div className={styles.text}>{currentItem.answer}</div>
            </div>
            <div>
              <button
                type="button"
                onClick={handleShare}
                disabled={loading}
                className={`${styles.shareButton} ${
                  loading ? styles.shareButtonDisabled : ""
                }`}
              >
                <Upload/> {loading ? "Loading..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
