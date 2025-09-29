import React, { useEffect, useRef, useState } from "react";
import styles from "./ScannerShareStory.module.css";
import message from "../../../../assets/image/storyshare.png";
import backgroundImg from "../../../../assets/image/background.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryScannerStore } from "../../../../hooks/useHistoryScannerStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import {
  useScreenshotExport,
  shareToTelegramStory,
} from "../../../../hooks/useScreenshotExport";
import {
  getStatusClassName,
  getStatusIcon,
  getStatusTranslationKey,
} from "../../productStatus";
import { trackButtonClick } from "../../../../api/analytics";
export const ScannerShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { id } = useParams<{ id: string | undefined }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<any>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const { loading, exportScreenshot } = useScreenshotExport();

  useEffect(() => {
    const preloadImages = (): Promise<void[]> => {
      const imagePromises = [message, backgroundImg].map((src) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            resolve();
          };
        });
      });

      return Promise.all(imagePromises);
    };

    const loadItem = async () => {
      if (!id) return;

      const item = await fetchHistoryItem(id);
      if (item) {
        setCurrentItem(item);
      }

      try {
        await preloadImages();
        setIsLoaded(true);
      } catch (err) {
        console.error("Error during image preloading:", err);
        setIsLoaded(true);
      }
    };

    loadItem();
  }, [id, fetchHistoryItem]);

  const handleShare = async () => {
    if (!currentItem || !id || !screenshotRef.current) return;

    // 📊 Аналитика: пользователь нажал "Поделиться"
    trackButtonClick("share_scanner_story_init", {
      scan_id: id,
      eng_type: currentItem.engType,
      products_count: currentItem.products?.length || 0,
      has_haram: (currentItem.haramProducts?.length || 0) > 0,
    });

    try {
      const buttonContainer = document.querySelector(`.${styles.blockButton}`);
      if (buttonContainer) {
        buttonContainer.classList.add(styles.hideForScreenshot);
      }

      const screenshotUrl = await exportScreenshot({
        element: screenshotRef.current,
        id: id,
      });

      if (buttonContainer) {
        buttonContainer.classList.remove(styles.hideForScreenshot);
      }

      if (screenshotUrl) {
        // 📊 Аналитика: скриншот успешно создан
        trackButtonClick("scanner_story_screenshot_created", {
          scan_id: id,
          screenshot_url_length: screenshotUrl.length,
        });

        // Попытка отправить в Telegram Story
        const success = await shareToTelegramStory(screenshotUrl);

        // 📊 Аналитика: результат отправки
        trackButtonClick("scanner_story_shared_to_telegram", {
          scan_id: id,
          success: success,
        });
      }
    } catch (error) {
      console.error("Failed to export and share screenshot:", error);
      // 📊 Аналитика: ошибка при экспорте/отправке
      trackButtonClick("share_scanner_story_failed", {
        scan_id: id,
        error: (error as Error).message || "unknown",
      });
      alert(t("exportFailed"));
    }
  };

  if (!isLoaded) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (!currentItem) {
    return (
      <PageWrapper showBackButton={true} navigateTo="/scanner/historyScanner">
        <div>{t("itemNotFound")}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      showBackButton={true}
      styleHave={false}
      navigateTo="/scanner/historyScanner"
    >
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

          <div className={styles.imageContainer}>
            <img
              src={message}
              alt="Message background"
              className={styles.foregroundImage}
              crossOrigin="anonymous"
            />

            <div className={styles.blockScan}>
              <div
                className={`${styles.accessBlock} ${getStatusClassName(
                  currentItem.engType,
                  styles
                )}`}
              >
                <div className={styles.statusProduct}>
                  {getStatusIcon(currentItem.engType)}
                  {t(getStatusTranslationKey(currentItem.engType))}
                </div>
                <div className={styles.QiblaGuidebot}>@QiblaGuidebot</div>
              </div>

              {currentItem.products && currentItem.products.length > 0 && (
                <div className={styles.blockInside}>
                  <div className={styles.scanTitle}>{t("ingredients")}</div>
                  <div className={styles.scanDesk}>
                    {currentItem.products.join(", ")}
                  </div>
                </div>
              )}

              {currentItem.haramProducts &&
                currentItem.haramProducts.length > 0 && (
                  <div className={styles.blockInside}>
                    <div className={styles.scanTitle}>{t("analysisResult")}</div>
                    <div className={styles.scanDesk}>
                      {currentItem.haramProducts.map(
                        (product: any, index: number) => (
                          <React.Fragment key={index}>
                            <strong>{product.name}</strong> - {product.reason} (
                            {product.source})
                            {index < currentItem.haramProducts.length - 1 && (
                              <br />
                            )}
                          </React.Fragment>
                        )
                      )}
                    </div>
                  </div>
                )}

              {currentItem.description && (
                <div className={styles.blockInside}>
                  <div className={styles.scanTitle}>{t("conclusion")}</div>
                  <div className={styles.scanDesk}>{currentItem.description}</div>
                </div>
              )}
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
            <Upload size={18} />
            {loading ? t("loading") : t("share")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};