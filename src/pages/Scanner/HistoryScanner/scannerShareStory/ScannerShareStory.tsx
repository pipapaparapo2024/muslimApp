import React, { useEffect, useRef, useState } from "react";
import styles from "./ScannerShareStory.module.css";
import backgroundImg from "../../../../assets/image/background.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryScannerStore } from "../../../../hooks/useHistoryScannerStore";
import { Upload } from "lucide-react";
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
import { useTranslationsStore } from "../../../../hooks/useTranslations";

export const ScannerShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { id } = useParams<{ id: string | undefined }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<any>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const { loading, exportScreenshot } = useScreenshotExport();
  const { translations } = useTranslationsStore();

  useEffect(() => {
    const loadItem = async () => {
      if (!id) return;

      const item = await fetchHistoryItem(id);
      if (item) {
        setCurrentItem(item);
      }

      try {
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

    trackButtonClick("food_scan","click_history_share")

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
        await shareToTelegramStory(screenshotUrl);
      }
    } catch (error) {
      console.error("Failed to export and share screenshot:", error);
      alert(translations?.exportFailed || "Export failed");
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
        <div>{translations?.itemNotFound || "Item not found"}</div>
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
            <div className={styles.blockScan}>
              <div
                className={`${styles.accessBlock} ${getStatusClassName(
                  currentItem.engType,
                  styles
                )}`}
              >
                <div className={styles.statusProduct}>
                  {getStatusIcon(currentItem.engType)}
                  {
                    translations?.[
                      getStatusTranslationKey(currentItem.engType)
                    ]
                  }
                </div>
                <div className={styles.QiblaGuidebot}>@QiblaGuidebot</div>
              </div>

              {currentItem.products && currentItem.products.length > 0 && (
                <div className={styles.blockInside}>
                  <div className={styles.scanTitle}>
                    {translations?.ingredients}
                  </div>
                  <div className={styles.scanDesk}>
                    {currentItem.products.join(", ")}
                  </div>
                </div>
              )}

              {currentItem.haramProducts &&
                currentItem.haramProducts.length > 0 && (
                  <div className={styles.blockInside}>
                    <div className={styles.scanTitle}>
                      {translations?.analysisResult}
                    </div>
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
                  <div className={styles.scanTitle}>
                    {translations?.conclusion}
                  </div>
                  <div className={styles.scanDesk}>
                    {currentItem.description}
                  </div>
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
            {loading
              ? translations?.loading || "Loading..."
              : translations?.share || "Share"}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
