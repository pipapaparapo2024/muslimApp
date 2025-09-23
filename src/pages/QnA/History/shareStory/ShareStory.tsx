import React, { useEffect, useRef, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import background from "../../../../assets/image/background.png"; // Добавляем фон
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

  // Используем хук для создания скриншотов
  const { loading, exportScreenshot } = useScreenshotExport();

  useEffect(() => {
    const preloadImages = (): Promise<void[]> => {
      const imagePromises = [
        message,
        background
      ].map(src => {
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

    const loadData = async () => {
      if (!id) return;

      try {
        const item = await getHistoryItem(id);
        await preloadImages();

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

    try {
      // Создаем скриншот элемента (без кнопки share, так как она находится вне screenshotRef)
      const screenshotUrl = await exportScreenshot({
        element: screenshotRef.current,
        id: id,
      });

      console.log("screenshotUrl", screenshotUrl);
      // Отправляем скриншот в Telegram
      if (screenshotUrl) {
        await shareToTelegramStory(screenshotUrl);
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
        {/* Элемент для скриншота с инлайн стилями для гарантии */}
        <div ref={screenshotRef} className={styles.contentWrapper}>
          {/* Фон как инлайн стиль для гарантии отображения */}
          <div 
            className={styles.backgroundContainer}
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0
            }}
          />
          
          {/* Основное изображение */}
          <img
            src={message}
            alt="Message background"
            className={styles.foregroundImage}
            crossOrigin="anonymous" // Важно для CORS
          />
          
          {/* Контент поверх изображений */}
          <div className={styles.blockMessages}>
            <div className={styles.blockMessageUser}>
              <div className={styles.nickName}>{t("you")}</div>
              <div className={styles.text}>{currentItem.question}</div>
            </div>
            <div className={styles.blockMessageBot}>
              <div className={styles.nickName}>@MuslimBot</div>
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
            data-story-visible="hide" // Помечаем для исключения из скриншота
          >
            <Upload size={18} />
            {loading ? t("loading") : t("share")}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};