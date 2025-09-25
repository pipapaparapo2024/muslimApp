import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/shareStory.png";
import backgroundImg from "../../../../assets/image/background.png";

import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import {
  useScreenshotExport,
  shareToTelegramStory,
} from "../../../../hooks/useScreenshotExport";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();
  const screenshotRef = useRef<HTMLDivElement>(null);

  const { loading, exportScreenshot } = useScreenshotExport();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
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

        const item = await getHistoryItem(id);
        await preloadImage(message);

        setCurrentItem(item);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);
  useEffect(() => {
    console.log("backgroundImg URL:", backgroundImg);
  }, []);
  const handleShare = async () => {
    if (!currentItem || !id || !screenshotRef.current) return;

    try {
      // Найдём элемент кнопки и скроем его перед экспортом
      const buttonContainer = screenshotRef.current.querySelector(
        `.${styles.blockButton}`
      );
      if (buttonContainer) {
        buttonContainer.classList.add(styles.hideForScreenshot);
      }

      const screenshotUrl = await exportScreenshot({
        element: screenshotRef.current,
        id: id,
      });

      console.log("screenshotUrl", screenshotUrl);

      // Восстанавливаем видимость кнопки
      if (buttonContainer) {
        buttonContainer.classList.remove(styles.hideForScreenshot);
      }

      if (screenshotUrl) {
        shareToTelegramStory(screenshotUrl);
      }
    } catch (error) {
      console.error("Failed to create and share screenshot:", error);
      alert(t("exportFailed"));
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
        {/* Видимый фон — для пользователя */}
        <img
          src={backgroundImg}
          alt="Background"
          className={styles.visibleBackground}
        />

        {/* Контент для скриншота */}
        <div ref={screenshotRef} className={styles.contentWrapper}>
          {/* Скрытый фон — только для скриншота */}
          <img
            src={backgroundImg}
            alt=""
            className={styles.hiddenBackgroundForScreenshot}
          />

          <div className={styles.messageContainer}>
            <img
              src={message}
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

          {/* Кнопка теперь внутри contentWrapper, но с классом для скрытия при скриншоте */}
          <div
            className={`${styles.blockButton} ${
              loading ? styles.hideForScreenshot : ""
            }`}
          >
            <button
              type="button"
              onClick={handleShare}
              disabled={loading}
              className={`${styles.shareButton} ${
                loading ? styles.shareButtonDisabled : ""
              }`}
            >
              <Upload /> {loading ? t("loading") : t("share")}
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
