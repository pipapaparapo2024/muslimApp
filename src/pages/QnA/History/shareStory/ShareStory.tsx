import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import backgroundImg from "../../../../assets/image/background.png";

import { useTranslationsStore } from "../../../../hooks/useTranslations";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import {
  useScreenshotExport,
  shareToTelegramStory,
} from "../../../../hooks/useScreenshotExport";
import { trackButtonClick } from "../../../../api/analytics";

export const ShareStory: React.FC = () => {
  const { translations } = useTranslationsStore();
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
        const item = await getHistoryItem(id);
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
    if (!currentItem || !id || !screenshotRef.current) return;

    // 📊 Аналитика: пользователь нажал "Поделиться"
    trackButtonClick("qa","click_history_share")

    try {
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

      // 📊 Аналитика: скриншот успешно создан
      if (screenshotUrl) {
        await shareToTelegramStory(screenshotUrl);
      }

      if (buttonContainer) {
        buttonContainer.classList.remove(styles.hideForScreenshot);
      }
    } catch (error) {
      console.error("Failed to create and share screenshot:", error);
      // 📊 Аналитика: ошибка при экспорте/отправке
      alert(translations?.exportFailed);
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
        <div>{translations?.requestNotFound}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false} navigateTo="/qna">
      <div className={styles.container}>
        <img
          src={backgroundImg}
          alt="Background"
          className={styles.visibleBackground}
        />

        <div ref={screenshotRef} className={styles.contentWrapper}>
          <img
            src={backgroundImg}
            alt=""
            className={styles.hiddenBackgroundForScreenshot}
          />

          <div className={styles.messageContainer}>
            <div className={styles.blockMessages}>
              <div className={styles.blockMessageUser}>
                <div className={styles.nickName}> {translations?.you}</div>
                <div className={styles.text}>{currentItem.question}</div>
              </div>
              <div className={styles.blockMessageBot}>
                <div className={styles.nickName}>@QiblaGuidebot</div>
                <div className={styles.text}>{currentItem.answer}</div>
              </div>
            </div>
          </div>

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
              <Upload /> {loading ? translations?.loading : translations?.share}
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
