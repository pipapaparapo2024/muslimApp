import React, { useEffect, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { useScreenshot } from "../../../../hooks/useScreenshot/useScreenshot";
import { useHtmlExport,QNA_HTML_STYLES } from "../../../../hooks/useHtmlExport";
import { Upload, Download } from "lucide-react";
import { t } from "i18next";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();

  const { createScreenshot, shareToTelegramStory, loading, imageRef } = useScreenshot();
  const { loading: htmlLoading, exportHtml } = useHtmlExport();

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
        type: 'qna',
        data: currentItem,
        styles: QNA_HTML_STYLES
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
        <div>{t('requestNotFound')}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper showBackButton={true} styleHave={false} navigateTo="/qna">
      <div className={styles.container}>
        <div className={styles.contentWrapper} ref={imageRef}>
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
              <div className={styles.nickName}>@MuslimBot</div>
              <div className={styles.text}>{currentItem.answer}</div>
            </div>
            <div className={styles.buttonsContainer}>
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
              
              <button
                type="button"
                onClick={handleExportHtml}
                disabled={htmlLoading}
                className={`${styles.exportButton} ${
                  htmlLoading ? styles.exportButtonDisabled : ""
                }`}
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