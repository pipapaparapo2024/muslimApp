import React, { useEffect, useState } from "react";
import styles from "./ShareStory.module.css";
import message from "../../../../assets/image/messageMuslim.png";
import { PageWrapper } from "../../../../shared/PageWrapper";
import { LoadingSpinner } from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useHistoryStore } from "../../../../hooks/useHistoryStore";
import { Upload } from "lucide-react";
import { t } from "i18next";
// Убираем useScreenshot, используем только useHtmlExport
import { useHtmlExport } from "../../../../hooks/useHtmlExport";
// Импортируем функцию для分享 в Telegram
import { shareToTelegramStory } from "../../../../hooks/useHtmlExport";

export const ShareStory: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const { getHistoryItem } = useHistoryStore();

  // Убираем useScreenshot, используем только useHtmlExport
  const { exportHtml, loading } = useHtmlExport();

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

  // ПЕРЕДЕЛЫВАЕМ handleShare - теперь он работает с HTML
  const handleShare = async () => {
    if (!currentItem) return;

    try {
      // 1. Генерируем HTML и загружаем на сервер
      const htmlFileUrl = await exportHtml({
        type: "qna",
        data: currentItem,
        // styles больше не передаем - хук сам знает какие стили использовать
      });

      // 2. Отправляем полученный URL в Telegram
      shareToTelegramStory(htmlFileUrl);

    } catch (error) {
      console.error("Failed to export and share HTML:", error);
      alert(t("exportFailed"));
    }
  };

  // Убираем handleExportHtml - теперь основная кнопка делает все

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
        {/* Убираем imageRef так как скриншоты больше не делаем */}
        <div className={styles.contentWrapper}>
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
              {/* Эта кнопка теперь делает ВСЕ: генерацию HTML + загрузку +分享 */}
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
      </div>
    </PageWrapper>
  );
};