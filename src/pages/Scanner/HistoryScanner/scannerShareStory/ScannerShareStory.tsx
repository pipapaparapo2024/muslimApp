import React, { useEffect, useRef, useState } from "react";
import styles from "./ScannerShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
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

export const ScannerShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { id } = useParams<{ id: string | undefined }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<any>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const { loading, exportScreenshot } = useScreenshotExport();

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

    const loadItem = async () => {
      if (!id) return;

      const item = await fetchHistoryItem(id);
      if (item) {
        setCurrentItem(item);
      }

      preloadImage(message)
        .then(() => setIsLoaded(true))
        .catch((err) => {
          console.error("Error during image preloading:", err);
          setIsLoaded(true);
        });
    };

    loadItem();
  }, [id, fetchHistoryItem]);

  const handleShare = async () => {
    if (!currentItem || !id || !screenshotRef.current) return;

    try {
      const screenshotUrl = await exportScreenshot({
        type: "scanner",
        element: screenshotRef.current,
        id: id,
      });

      if (screenshotUrl) {
        shareToTelegramStory(screenshotUrl);
      }
    } catch (error) {
      console.error("Failed to export and share screenshot:", error);
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
        <div ref={screenshotRef} className={styles.contentWrapper}>
          <img
            src={message}
            alt="Message background"
            className={styles.backgroundImage}
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
              <div className={styles.QiblaGuidebot}> @QiblaGuidebot</div>
            </div>

            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("ingredients")}</div>
              <div className={styles.scanDesk}>
                {currentItem.products &&
                  currentItem.products.length > 0 &&
                  currentItem.products.join(", ")}
              </div>
            </div>

            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("analysisResult")}</div>
                  <div className={styles.scanDesk}>
              {currentItem.haramProducts &&
                currentItem.haramProducts.length > 0 &&
                currentItem.haramProducts.map((product: any) => (
                    <div className={styles.haranProduct}>
                      {product.name} - {product.reason}
                      {product.source}
                    </div>
                ))}
                  </div>
            </div>
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("conclusion")}</div>
              <div className={styles.scanDesk}>{currentItem.description}</div>
            </div>
          </div>
        </div>

        {/* Кнопка share ВНЕ элемента для скриншота */}
        <div className={styles.blockButton}>
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
