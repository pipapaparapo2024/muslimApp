import React, { useEffect, useRef, useState } from "react";
import styles from "./ScannerShareStory.module.css";
import message from "../../../../assets/image/shareStory.png";
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

export const ScannerShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
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

        const item = await fetchHistoryItem(id);
        await preloadImage(message);

        setCurrentItem(item);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [id, fetchHistoryItem]);

  const handleShare = async () => {
    if (!currentItem || !id || !screenshotRef.current) return;

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
        {/* Видимый фон */}
        <img
          src={backgroundImg}
          alt="Background"
          className={styles.visibleBackground}
        />

        {/* Контент для скриншота */}
        <div ref={screenshotRef} className={styles.contentWrapper}>
          {/* Скрытый фон для скриншота */}
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

            {/* Контент поверх изображения - ВЫРОВНЯН ПО ПРАВОЙ СТОРОНЕ */}
            <div className={styles.blockMessages}>
              {/* Блок статуса продукта - тоже выровнен по правой стороне */}
              <div className={styles.blockMessageStatus}>
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
              </div>

              {/* Ингредиенты */}
              {currentItem.products && currentItem.products.length > 0 && (
                <div className={styles.blockMessageBot}>
                  <div className={styles.scanTitle}>{t("ingredients")}</div>
                  <div className={styles.text}>
                    {currentItem.products.join(", ")}
                  </div>
                </div>
              )}

              {/* Результаты анализа */}
              {/* Результаты анализа - ОДИН блок для всех продуктов */}
              {currentItem.haramProducts &&
                currentItem.haramProducts.length > 0 && (
                  <div className={styles.blockMessageBot}>
                    <div className={styles.scanTitle}>
                      {t("analysisResult")}
                    </div>
                    <div className={styles.text}>
                      {currentItem.haramProducts.map(
                        (product: any, index: number) => (
                          <div key={index} className={styles.productItem}>
                            <strong>{product.name}</strong> - {product.reason}{" "}
                            {product.source}
                            {index < currentItem.haramProducts.length - 1 && (
                              <br />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Заключение */}
              {currentItem.description && (
                <div className={styles.blockMessageBot}>
                  <div className={styles.scanTitle}>{t("conclusion")}</div>
                  <div className={styles.text}>{currentItem.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка */}
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
