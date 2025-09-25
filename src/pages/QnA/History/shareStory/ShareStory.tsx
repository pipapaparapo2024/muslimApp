// src/pages/ShareStory/ShareStory.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";

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
      console.log("🔍 [ShareStory] useEffect triggered. ID:", id);
      if (!id) {
        console.warn("⚠️ [ShareStory] No ID provided");
        return;
      }

      try {
        console.log("📥 [ShareStory] Fetching history item...");
        const item = await getHistoryItem(id);
        console.log("✅ [ShareStory] History item loaded:", item);
        setCurrentItem(item);

        const checkReady = (): boolean => {
          if (!screenshotRef.current) {
            console.warn("⚠️ [checkReady] screenshotRef is null");
            return false;
          }

          const images = screenshotRef.current.querySelectorAll('img');
          console.log(`🖼️ [checkReady] Found ${images.length} images`);

          const allLoaded = Array.from(images).every(img => {
            const result = img.complete && img.naturalHeight > 0;
            console.log(`🖼️ [checkReady] Image ${img.src} loaded: ${result} (complete: ${img.complete}, naturalHeight: ${img.naturalHeight})`);
            return result;
          });

          const hasSize = screenshotRef.current.offsetWidth > 0 && screenshotRef.current.offsetHeight > 0;
          console.log(`📏 [checkReady] Element size: ${screenshotRef.current.offsetWidth}x${screenshotRef.current.offsetHeight}`);

          return allLoaded && hasSize;
        };

        if (checkReady()) {
          console.log("✅ [ShareStory] Content is ready immediately");
          setIsReady(true);
        } else {
          console.log("⏳ [ShareStory] Waiting for content to be ready...");
          const interval = setInterval(() => {
            if (checkReady()) {
              console.log("✅ [ShareStory] Content became ready after delay");
              setIsReady(true);
              clearInterval(interval);
            }
          }, 100);

          setTimeout(() => {
            clearInterval(interval);
            console.warn("⚠️ [ShareStory] Timeout reached, forcing ready=true");
            setIsReady(true);
          }, 3000);
        }
      } catch (error) {
        console.error("❌ [ShareStory] Error loading data:", error);
        setIsReady(true);
      }
    };

    loadData();
  }, [id, getHistoryItem]);

  const handleShare = async () => {
    if (!currentItem || !id || !screenshotRef.current) {
      console.warn("⚠️ [handleShare] Missing data:", { currentItem, id, ref: screenshotRef.current });
      alert(t("pleaseWait"));
      return;
    }

    console.log("📤 [handleShare] Starting export process...");
    try {
      const screenshotUrl = await exportScreenshot({
        element: screenshotRef.current,
        id: id,
      });

      console.log("✅ [handleShare] Export completed. URL:", screenshotUrl);

      if (screenshotUrl) {
        console.log("📲 [handleShare] Sharing to Telegram...");
        await shareToTelegramStory(screenshotUrl);
        console.log("✅ [handleShare] Shared successfully");
      }
    } catch (error) {
      console.error("❌ [handleShare] Failed to create and share screenshot:", error);
      alert(t("exportFailed"));
    }
  };

  if (!isReady || !currentItem) {
    console.log("⏳ [Render] Still loading or no item");
    return (
      <PageWrapper showBackButton={true}>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  console.log("✅ [Render] Rendering content with item:", currentItem);
  return (
    <PageWrapper showBackButton={true} styleHave={false} navigateTo="/qna">
      <div className={styles.container}>
        <div ref={screenshotRef} className={styles.contentWrapper}>
          <img
            src={"../../../../assets/image/shareStory.png"}
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