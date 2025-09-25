// pages/QnA/History/shareStory/ShareStory.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import messageImg from "../../../../assets/image/shareStory.png";
import backgroundImg from "../../../../assets/image/background.png";

import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import { shareToTelegramStory, captureElementAsBlobUrl } from "../../../../hooks/useScreenshotExport";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();
  const screenshotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        const preload = (src: string) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = img.onerror = () => resolve();
          });

        const item = await getHistoryItem(id);
        await Promise.all([preload(messageImg), preload(backgroundImg)]);

        setCurrentItem(item);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);

  const handleShare = async () => {
    if (!screenshotRef.current || !currentItem) {
      alert(t("exportFailed"));
      return;
    }

    setIsCapturing(true);
    try {
      const url = await captureElementAsBlobUrl(screenshotRef.current, {
        width: 390,
        backgroundColor: "transparent",
      });

      await shareToTelegramStory(url);
    } catch (error: any) {
      console.error("Ошибка при создании скриншота:", error);
      alert(`${t("exportFailed")}${error.message ? `: ${error.message}` : ""}`);
    } finally {
      setIsCapturing(false);
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
        <div>{t("requestNotFound")}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false} navigateTo="/qna">
      <div className={styles.container}>
        {/* Фоновое изображение — будет включено в скриншот */}
        <img
          src={backgroundImg}
          alt="Background"
          className={styles.backgroundImage}
        />

        {/* Элемент для скриншота */}
        <div
          ref={screenshotRef}
          className={styles.contentWrapper}
          data-screenshot-content // ← маркер для поднятия z-index
        >
          <img
            src={messageImg}
            className={styles.messageImage}
            alt="Message background"
          />
          <div className={styles.blockMessages}>
            <div className={styles.blockMessageUser}>
              <div className={styles.nickName}>{t("you")}</div>
              <div className={styles.text}>{currentItem.question}</div>
            </div>
            <div className={styles.blockMessageBot}>
              <div className={styles.nickName}>@QiblaGuidebot</div>
              <div className={styles.text}>{currentItem.answer}</div>
            </div>
          </div>
        </div>

        {/* Кнопка ВНЕ скриншота */}
        <div className={styles.blockButton}>
          <button
            type="button"
            onClick={handleShare}
            disabled={isCapturing}
            className={`${styles.shareButton} ${
              isCapturing ? styles.shareButtonDisabled : ""
            }`}
          >
            <Upload /> {isCapturing ? t("loading") : t("share")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};