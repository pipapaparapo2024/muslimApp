import React, { useEffect, useState } from "react";
import styles from "./ScannerShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryScannerStore,type QaItem } from "../../../../hooks/useHistoryScannerStore";
import { useScreenshot } from "../../../../hooks/useScreenshot/useScreenshot";
import { useHtmlExport, SCANNER_HTML_STYLES } from "../../../../hooks/useHtmlExport";
import { CircleCheck, CircleX, Upload, Download } from "lucide-react";
import { t } from "i18next";

export const ScannerShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { fetchHistoryItem } = useHistoryScannerStore();
  const [currentItem, setCurrentItem] = useState<QaItem | null>(null);

  const { createScreenshot, shareToTelegramStory, loading, imageRef } = useScreenshot();
  const { loading: htmlLoading, exportHtml } = useHtmlExport();

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

  const isHaram = (): boolean => {
    return currentItem?.haranProducts?.some(product => product.isHaran) || false;
  };

  const handleShare = async () => {
    try {
      const imageUrl = await createScreenshot();
      await shareToTelegramStory(imageUrl);
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleExportHtml = async () => {
    if (!currentItem) return;
    
    try {
      const htmlFileUrl = await exportHtml({
        type: 'scanner',
        data: currentItem,
        styles: SCANNER_HTML_STYLES
      });
      
      window.open(htmlFileUrl, '_blank');
    } catch (error) {
      console.error("Failed to export HTML:", error);
      alert(t('exportFailed'));
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
        <div>{t("itemNotFound")}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false}>
      <div className={styles.container}>
        <div className={styles.contentWrapper} ref={imageRef}>
          <img src={message} alt="Message background" />
          <div className={styles.blockScan}>
            <div className={styles.blockAccess}>
              {isHaram() ? (
                <div className={`${styles.accessBlock} ${styles.haram}`}>
                  <CircleX size={24} strokeWidth={1.5} /> {t("haram")}
                </div>
              ) : (
                <div className={`${styles.accessBlock} ${styles.halal}`}>
                  <CircleCheck size={24} strokeWidth={1.5} />
                  {t("halal")}
                </div>
              )}
            </div>
            
            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("productName")}</div>
              <div className={styles.scanDesk}>{currentItem.name}</div>
            </div>

            <div className={styles.blockInside}>
              <div className={styles.scanTitle}>{t("description")}</div>
              <div className={styles.scanDesk}>{currentItem.description}</div>
            </div>

            <div className={styles.buttonsContainer}>
              <button
                type="button"
                onClick={handleShare}
                disabled={loading}
                className={`${styles.shareButton} ${loading ? styles.shareButtonDisabled : ""}`}
              >
                <Upload /> {loading ? t("loading") : t("share")}
              </button>
              
              <button
                type="button"
                onClick={handleExportHtml}
                disabled={htmlLoading}
                className={`${styles.exportButton} ${htmlLoading ? styles.exportButtonDisabled : ""}`}
              >
                <Download /> {htmlLoading ? t("loading") : t("exportHtml")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};