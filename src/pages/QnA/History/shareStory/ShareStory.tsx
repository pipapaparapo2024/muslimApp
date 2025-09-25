import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
// import message from "../../../../assets/image/shareStory.png";
import background from '../../../../assets/image/background.svg'
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
import { useScreenshotExport, shareToTelegramStory } from "../../../../hooks/useScreenshotExport";

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
        // Функция предзагрузки изображений
        const preloadImage = (src: string): Promise<void> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              console.log('Image preloaded:', src);
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to preload image: ${src}`);
              resolve();
            };
          });
        };

        const item = await getHistoryItem(id);
        
        // Предзагружаем основное изображение
        await preloadImage(background);

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
    if (!currentItem || !id || !screenshotRef.current) {
      console.error('Missing required data:', { currentItem, id, screenshotRef: screenshotRef.current });
      return;
    }

    try {
      console.log('Starting share process...');
      
      // Создаем скриншот элемента
      const screenshotUrl = await exportScreenshot({
        element: screenshotRef.current,
        id: id,
      });

      console.log("Screenshot URL received:", screenshotUrl);
      
      // Отправляем скриншот в Telegram
      if (screenshotUrl) {
        await shareToTelegramStory(screenshotUrl);
      } else {
        throw new Error('No screenshot URL received');
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
        
        {/* Оберточный div для скриншота */}
        <div 
          ref={screenshotRef} 
          className={styles.contentWrapper}
          style={{ 
            backgroundImage: `url(${background})`, // используем backgroundImage вместо img
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top center'
          }}
        >
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
        
        {/* Кнопка share находится ВНЕ элемента для скриншота */}
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