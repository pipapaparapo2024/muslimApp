// src/pages/ShareStory/ShareStory.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/shareStory.png";

import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import { useScreenshotExport, shareToTelegramStory } from "../../../../hooks/useScreenshotExport";

export const ShareStory: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
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

        const checkReady = (): boolean => {
          if (!screenshotRef.current) return false;

          const images = screenshotRef.current.querySelectorAll('img');
          const allLoaded = Array.from(images).every(img =>
            img.complete && img.naturalHeight > 0
          );

          const hasSize = screenshotRef.current.offsetWidth > 0 && screenshotRef.current.offsetHeight > 0;
          return allLoaded && hasSize;
        };

        if (checkReady()) {
          setIsReady(true);
        } else {
          const interval = setInterval(() => {
            if (checkReady()) {
              setIsReady(true);
              clearInterval(interval);
            }
          }, 100);

          setTimeout(() => {
            clearInterval(interval);
            setIsReady(true); // fallback
          }, 3000);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setIsReady(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);

  const handleShare = async () => {
    if (!currentItem || !id || !screenshotRef.current) {
      alert(t("pleaseWait"));
      return;
    }

    try {
      const screenshotUrl = await exportScreenshot({
        element: screenshotRef.current,
        id: id,
      });

      if (screenshotUrl) {
        await shareToTelegramStory(screenshotUrl);
      }
    } catch (error) {
      console.error("Failed to create and share screenshot:", error);
      alert(t("exportFailed"));
    }
  };

  if (!isReady || !currentItem) {
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false} navigateTo="/qna">
      <div className={styles.container}>
        <div ref={screenshotRef} className={styles.contentWrapper}>
          <img
            src={message}
            className={styles.messageImage}
            alt="Message background"
            crossOrigin="anonymous"
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

        <div className={styles.blockButton}>
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
    </PageWrapper>
  );
};